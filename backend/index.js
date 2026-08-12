const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS ve Body Parser Ayarları
app.use(cors());
app.use(express.json());

// 'uploads' klasörünü otomatik oluştur
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// 1. Veritabanı Bağlantısı ve Foreign Key Desteği
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Veritabanı Hatası:', err.message);
  } else {
    console.log('✅ SQLite veritabanına başarıyla bağlandı.');
    // Foreign Key kısıtlamalarını aktif et
    db.run('PRAGMA foreign_keys = ON;');
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
      kategori VARCHAR(50),
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
      bildiren_tc VARCHAR(11),
      bildirim_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      fotograf_url VARCHAR(255),
      durum VARCHAR(20) DEFAULT 'Açık',
      cozum_notu TEXT,
      cozum_tarihi TIMESTAMP,
      FOREIGN KEY (demirbas_id) REFERENCES demirbaslar(id) ON DELETE CASCADE
    )
  `);
});

// Statik Dosya Servisi ve Multer Yapılandırması
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// --- API ENDPOINTLARI ---

// A) KULLANICI İŞLEMLERİ

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

// Kullanıcı Hesabını Sil
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

// B) DEMİRBAŞ İŞLEMLERİ

// Tüm Demirbaşları Getir
app.get('/api/demirbaslar', (req, res) => {
  db.all('SELECT * FROM demirbaslar ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
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

// Yeni Demirbaş Ekle
app.post('/api/demirbaslar', (req, res) => {
  const { qr_kod, ad, kategori, birim, konum, alim_tarihi } = req.body;
  const sql = `INSERT INTO demirbaslar (qr_kod, ad, kategori, birim, konum, alim_tarihi) VALUES (?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [qr_kod, ad, kategori, birim, konum, alim_tarihi], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Bu Demirbaş/Seri Kodu zaten kullanılıyor.' });
      }
      return res.status(400).json({ error: err.message });
    }

    res.json({ id: this.lastID, qr_kod, ad, kategori, birim, konum, alim_tarihi });
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
    LEFT JOIN demirbaslar ON arizalar.demirbas_id = demirbaslar.id 
    ORDER BY arizalar.id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Arıza Kaydı Oluştur (Hem 'resim' hem 'fotograf' alan adı ile gelen yüklemeleri destekler)
app.post('/api/arizalar', upload.single('resim'), (req, res) => {
  const { demirbas_id, aciklama, bildiren_kisi, bildiren_tc } = req.body;
  
  // Resim seçilmediyse null döner, çökme yaşanmaz
  const fotograf_url = (req.file && req.file.filename) ? `/uploads/${req.file.filename}` : null;
  
  const sql = `INSERT INTO arizalar (demirbas_id, aciklama, bildiren_kisi, bildiren_tc, fotograf_url) VALUES (?, ?, ?, ?, ?)`;
  
  db.run(sql, [demirbas_id, aciklama, bildiren_kisi, bildiren_tc, fotograf_url], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, message: 'Arıza kaydı başarıyla oluşturuldu.' });
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

// Arıza Kaydını Sil (Eklenen yeni endpoint)
app.delete('/api/arizalar/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM arizalar WHERE id = ?';

  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ error: 'Arıza kaydı silinirken bir hata oluştu.' });
    res.json({ message: 'Arıza kaydı başarıyla silindi.' });
  });
});

// Sunucuyu Dinleme
app.listen(PORT, () => {
  console.log(` Sunucu http://localhost:${PORT} adresinde CANLI dinliyor...`);
});