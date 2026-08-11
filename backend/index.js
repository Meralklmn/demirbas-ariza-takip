const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS ve Body Parser Ayarları
app.use(cors());
app.use(express.json());

// 'uploads' klasörü yoksa otomatik oluştur (Multer hatası almamak için)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// 1. Veritabanı Bağlantısı
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Veritabanı Hatası:', err.message);
  } else {
    console.log('✅ SQLite veritabanına başarıyla bağlandı.');
  }
});

// 2. Tabloları Oluşturma
db.serialize(() => {
  // Kullanıcılar Tablosu
  db.run(`
    CREATE TABLE IF NOT EXISTS kullanicilar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tc_no VARCHAR(11) UNIQUE NOT NULL,
      ad_soyad VARCHAR(100) NOT NULL,
      rol VARCHAR(20) DEFAULT 'personel',
      olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Demirbaşlar Tablosu
  db.run(`
    CREATE TABLE IF NOT EXISTS demirbaslar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      qr_kod VARCHAR(20) UNIQUE NOT NULL,
      ad VARCHAR(100) NOT NULL,
      kategori VARCHAR(50) NOT NULL,
      birim VARCHAR(100),
      konum VARCHAR(150),
      alim_tarihi DATE,
      durum VARCHAR(20) DEFAULT 'Aktif',
      olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Arızalar Tablosu
  db.run(`
    CREATE TABLE IF NOT EXISTS arizalar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      demirbas_id INTEGER NOT NULL,
      aciklama TEXT NOT NULL,
      bildiren_kisi VARCHAR(100),
      bildirim_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fotograf_url VARCHAR(255),
      durum VARCHAR(20) DEFAULT 'Açık',
      cozum_notu TEXT,
      cozum_tarihi TIMESTAMP,
      FOREIGN KEY (demirbas_id) REFERENCES demirbaslar(id)
    )
  `);
});

// 3. Statik Klasör Servisi ve Multer
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// --- API ENDPOINTLARI ---

// A) KULLANICI / LOGIN / REGISTER

// Kayıt Ol
app.post('/api/register', (req, res) => {
  const { tc_no, ad_soyad, rol } = req.body;

  if (!tc_no || tc_no.length !== 11) {
    return res.status(400).json({ error: 'Geçerli bir 11 haneli T.C. Kimlik No giriniz.' });
  }

  if (!ad_soyad || !ad_soyad.trim()) {
    return res.status(400).json({ error: 'Ad Soyad alanı boş bırakılamaz.' });
  }

  const kullaniciRolu = rol || 'personel';
  const sql = `INSERT INTO kullanicilar (tc_no, ad_soyad, rol) VALUES (?, ?, ?)`;
  
  db.run(sql, [tc_no, ad_soyad, kullaniciRolu], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Bu T.C. Kimlik Numarası zaten sistemde kayıtlı!' });
      }
      return res.status(500).json({ error: 'Kayıt yapılırken veritabanı hatası oluştu.' });
    }

    res.json({ 
      message: 'Kayıt başarıyla oluşturuldu.', 
      user: { id: this.lastID, tc_no, ad_soyad, rol: kullaniciRolu } 
    });
  });
});

// Giriş Yap
app.post('/api/login', (req, res) => {
  const { tc_no } = req.body;

  if (!tc_no) {
    return res.status(400).json({ error: 'T.C. Kimlik No girilmelidir.' });
  }

  const sql = `SELECT * FROM kullanicilar WHERE tc_no = ?`;
  db.get(sql, [tc_no], (err, row) => {
    if (err) return res.status(500).json({ error: 'Veritabanı hatası.' });

    if (!row) {
      return res.status(404).json({ message: 'Bu T.C. Kimlik Numarasına ait kayıt bulunamadı. Lütfen önce kayıt olun.' });
    }

    res.json({
      message: 'Giriş başarılı',
      user: {
        id: row.id,
        tc_no: row.tc_no,
        ad_soyad: row.ad_soyad,
        rol: row.rol
      }
    });
  });
});

// Kullanıcı Hesabını Silme API'si
app.delete('/api/kullanicilar/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM kullanicilar WHERE id = ?';

  db.run(sql, [id], function (err) {
    if (err) {
      console.error('Kullanıcı silme hatası:', err);
      return res.status(500).json({ error: 'Hesap silinirken bir hata oluştu.' });
    }
    res.json({ message: 'Kullanıcı hesabı başarıyla silindi.' });
  });
});

// Bozuk ve Gereksiz Kayıtları Temizleme API'si (SQLITE DÜZELTİLDİ)
app.get('/api/temizle-bozuk-kullanicilar', (req, res) => {
  const sql = `
    DELETE FROM kullanicilar 
    WHERE ad_soyad IS NULL 
       OR ad_soyad = 'undefined' 
       OR ad_soyad = 'isimsiz' 
       OR ad_soyad = '' 
       OR tc_no IS NULL 
       OR tc_no = 'undefined' 
       OR tc_no = ''
  `;

  db.run(sql, [], function (err) {
    if (err) {
      console.error('Temizleme hatası:', err.message);
      return res.status(500).json({ error: 'Temizlik yapılırken hata oluştu.' });
    }
    res.json({ 
      message: 'Bozuk ve gereksiz kayıtlar başarıyla temizlendi!', 
      silinen_kayit_sayisi: this.changes 
    });
  });
});

// B) DEMİRBAŞ İŞLEMLERİ

// Tüm Demirbaşları Getir
app.get('/api/demirbaslar', (req, res) => {
  db.all('SELECT * FROM demirbaslar ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Tek Demirbaş Getir
app.get('/api/demirbaslar/:id', (req, res) => {
  db.get('SELECT * FROM demirbaslar WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Demirbaş bulunamadı.' });
    res.json(row);
  });
});

// Yeni Demirbaş Ekle & QR Oluştur
app.post('/api/demirbaslar', async (req, res) => {
  const { qr_kod, ad, kategori, birim, konum, alim_tarihi } = req.body;
  const sql = `INSERT INTO demirbaslar (qr_kod, ad, kategori, birim, konum, alim_tarihi) VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [qr_kod, ad, kategori, birim, konum, alim_tarihi], async function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Bu QR / Barkod Kodu zaten kullanılıyor.' });
      }
      return res.status(400).json({ error: err.message });
    }

    const demirbasId = this.lastID;
    const targetUrl = `https://demirbas-ariza-takip.onrender.com/demirbas/${demirbasId}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(targetUrl);
      res.json({ id: demirbasId, qr_kod, ad, kategori, birim, konum, alim_tarihi, targetUrl, qrDataUrl });
    } catch (qrErr) {
      res.status(500).json({ error: 'QR kod oluşturulamadı.' });
    }
  });
});

// Kayıtlı Demirbaşın QR Kodunu Tekrar Çağır
app.get('/api/demirbaslar/:id/qr', async (req, res) => {
  db.get('SELECT * FROM demirbaslar WHERE id = ?', [req.params.id], async (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Demirbaş bulunamadı' });
    const targetUrl = `https://demirbas-ariza-takip.onrender.com/demirbas/${row.id}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(targetUrl);
      res.json({ id: row.id, ad: row.ad, qr_kod: row.qr_kod, qrDataUrl });
    } catch (qrErr) {
      res.status(500).json({ error: 'QR Kod üretilemedi' });
    }
  });
});

// Demirbaş Sil (Bağlı arızalarla birlikte)
app.delete('/api/demirbaslar/:id', (req, res) => {
  const demirbasId = req.params.id;
  db.run('DELETE FROM arizalar WHERE demirbas_id = ?', [demirbasId], (err) => {
    if (err) return res.status(500).json({ error: 'Arızalar silinemedi.' });
    db.run('DELETE FROM demirbaslar WHERE id = ?', [demirbasId], function (err) {
      if (err) return res.status(500).json({ error: 'Demirbaş silinemedi.' });
      res.json({ message: 'Demirbaş ve arıza geçmişi başarıyla silindi.' });
    });
  });
});

// C) ARIZA İŞLEMLERİ

// Tüm Arızaları Getir
app.get('/api/arizalar', (req, res) => {
  const sql = `
    SELECT arizalar.*, demirbaslar.ad as demirbas_adi, demirbaslar.qr_kod 
    FROM arizalar 
    JOIN demirbaslar ON arizalar.demirbas_id = demirbaslar.id 
    ORDER BY arizalar.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Arıza Kaydı Oluştur
app.post('/api/arizalar', upload.single('fotograf'), (req, res) => {
  const { demirbas_id, aciklama, bildiren_kisi } = req.body;
  const fotograf_url = req.file ? `/uploads/${req.file.filename}` : null;
  const sql = `INSERT INTO arizalar (demirbas_id, aciklama, bildiren_kisi, fotograf_url) VALUES (?, ?, ?, ?)`;
  
  db.run(sql, [demirbas_id, aciklama, bildiren_kisi, fotograf_url], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Arıza kaydı oluşturuldu.' });
  });
});

// Arıza Durumunu Güncelle (Çözüldü / İşlemde)
app.put('/api/arizalar/:id', (req, res) => {
  const { durum, cozum_notu } = req.body;
  const cozum_tarihi = durum === 'Çözüldü' ? new Date().toISOString() : null;
  const sql = `UPDATE arizalar SET durum = ?, cozum_notu = ?, cozum_tarihi = ? WHERE id = ?`;
  
  db.run(sql, [durum, cozum_notu, cozum_tarihi, req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: 'Arıza durumu güncellendi.' });
  });
});

// Sunucuyu Dinleme
app.listen(PORT, () => {
  console.log(` Sunucu http://localhost:${PORT} adresinde CANLI dinliyor...`);
});