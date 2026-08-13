require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

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

// 1. PostgreSQL Veritabanı Bağlantısı
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Neon ve bulut PostgreSQL bağlantıları için şarttır
  }
});

db.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL Veritabanı Hatası:', err.stack);
  } else {
    console.log('✅ PostgreSQL veritabanına başarıyla bağlandı.');
    release();
  }
});

// 2. Tabloları Otomatik Oluşturma (PostgreSQL Uyumlu)
const initDb = async () => {
  try {
    // Kullanıcılar Tablosu
    await db.query(`
      CREATE TABLE IF NOT EXISTS kullanicilar (
        id SERIAL PRIMARY KEY,
        tc_no VARCHAR(11) UNIQUE NOT NULL,
        ad_soyad VARCHAR(100) NOT NULL,
        rol VARCHAR(20) DEFAULT 'personel',
        olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Demirbaşlar Tablosu
    await db.query(`
      CREATE TABLE IF NOT EXISTS demirbaslar (
        id SERIAL PRIMARY KEY,
        qr_kod VARCHAR(20) UNIQUE NOT NULL,
        ad VARCHAR(100) NOT NULL,
        kategori VARCHAR(50),
        birim VARCHAR(100),
        konum VARCHAR(150),
        alim_tarihi DATE,
        durum VARCHAR(20) DEFAULT 'Aktif',
        olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Arızalar Tablosu
    await db.query(`
      CREATE TABLE IF NOT EXISTS arizalar (
        id SERIAL PRIMARY KEY,
        demirbas_id INTEGER NOT NULL,
        aciklama TEXT NOT NULL,
        bildiren_kisi VARCHAR(100),
        bildiren_tc VARCHAR(11),
        bildirim_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fotograf_url VARCHAR(255),
        durum VARCHAR(20) DEFAULT 'Açık',
        cozum_notu TEXT,
        cozum_tarihi TIMESTAMP,
        CONSTRAINT fk_demirbas FOREIGN KEY (demirbas_id) REFERENCES demirbaslar(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ PostgreSQL tabloları başarıyla hazırlandı.');
  } catch (err) {
    console.error('❌ Tablo oluşturulurken hata:', err.message);
  }
};

initDb();

// Statik Dosya Servisi ve Multer Yapılandırması
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// Kök Rota & Sağlık Kontrolü (Render Cold-Start Kontrolü İçin)
app.get('/', (req, res) => {
  res.json({ message: 'Demirbaş & Arıza Takip API Canlı ve Çalışıyor 🚀' });
});

// --- API ENDPOINTLARI ---

// A) KULLANICI İŞLEMLERİ

// Kayıt Ol
app.post('/api/register', async (req, res) => {
  const { tc_no, ad_soyad, rol } = req.body;

  if (!tc_no || tc_no.length !== 11) {
    return res.status(400).json({ error: 'Geçerli bir 11 haneli T.C. Kimlik No giriniz.' });
  }

  if (!ad_soyad || !ad_soyad.trim()) {
    return res.status(400).json({ error: 'Ad Soyad alanı boş bırakılamaz.' });
  }

  const kullaniciRolu = rol || 'personel';
  const sql = `INSERT INTO kullanicilar (tc_no, ad_soyad, rol) VALUES ($1, $2, $3) RETURNING *`;

  try {
    const result = await db.query(sql, [tc_no, ad_soyad, kullaniciRolu]);
    res.json({
      message: 'Kayıt başarıyla oluşturuldu.',
      user: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') { // PostgreSQL Unique Constraint Error Code
      return res.status(400).json({ error: 'Bu T.C. Kimlik Numarası zaten sistemde kayıtlı!' });
    }
    res.status(500).json({ error: 'Kayıt yapılırken veritabanı hatası oluştu.' });
  }
});

// Giriş Yap
app.post('/api/login', async (req, res) => {
  const { tc_no } = req.body;

  if (!tc_no) {
    return res.status(400).json({ error: 'T.C. Kimlik No girilmelidir.' });
  }

  const sql = `SELECT * FROM kullanicilar WHERE tc_no = $1`;

  try {
    const result = await db.query(sql, [tc_no]);
    const row = result.rows[0];

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
  } catch (err) {
    res.status(500).json({ error: 'Veritabanı hatası.' });
  }
});

// Kullanıcı Hesabını Sil
app.delete('/api/kullanicilar/:id', async (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM kullanicilar WHERE id = $1';

  try {
    await db.query(sql, [id]);
    res.json({ message: 'Kullanıcı hesabı başarıyla silindi.' });
  } catch (err) {
    console.error('Kullanıcı silme hatası:', err);
    res.status(500).json({ error: 'Hesap silinirken bir hata oluştu.' });
  }
});

// B) DEMİRBAŞ İŞLEMLERİ

// Tüm Demirbaşları Getir
app.get('/api/demirbaslar', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM demirbaslar ORDER BY id DESC');
    res.json(result.rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tek Demirbaş Getir
app.get('/api/demirbaslar/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM demirbaslar WHERE id = $1', [req.params.id]);
    const row = result.rows[0];

    if (!row) return res.status(404).json({ message: 'Demirbaş bulunamadı.' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yeni Demirbaş Ekle
app.post('/api/demirbaslar', async (req, res) => {
  const { qr_kod, ad, kategori, birim, konum, alim_tarihi } = req.body;
  const sql = `INSERT INTO demirbaslar (qr_kod, ad, kategori, birim, konum, alim_tarihi) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;

  try {
    const result = await db.query(sql, [qr_kod, ad, kategori, birim, konum, alim_tarihi]);
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Bu Demirbaş/Seri Kodu zaten kullanılıyor.' });
    }
    res.status(400).json({ error: err.message });
  }
});

// Demirbaş Sil (Bağlı arızalarla birlikte)
app.delete('/api/demirbaslar/:id', async (req, res) => {
  const demirbasId = req.params.id;

  try {
    // ON DELETE CASCADE kuralımız olduğu için arizalar tablosundaki veriler otomatik silinir, 
    // ama direkt demirbaşı silebiliriz:
    await db.query('DELETE FROM demirbaslar WHERE id = $1', [demirbasId]);
    res.json({ message: 'Demirbaş ve arıza geçmişi başarıyla silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Demirbaş silinemedi.' });
  }
});

// C) ARIZA İŞLEMLERİ

// Tüm Arızaları Getir
app.get('/api/arizalar', async (req, res) => {
  const sql = `
    SELECT arizalar.*, demirbaslar.ad as demirbas_adi, demirbaslar.qr_kod 
    FROM arizalar 
    LEFT JOIN demirbaslar ON arizalar.demirbas_id = demirbaslar.id 
    ORDER BY arizalar.id DESC
  `;

  try {
    const result = await db.query(sql);
    res.json(result.rows || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Arıza Kaydı Oluştur
app.post('/api/arizalar', upload.single('resim'), async (req, res) => {
  const { demirbas_id, aciklama, bildiren_kisi, bildiren_tc } = req.body;
  const fotograf_url = (req.file && req.file.filename) ? `/uploads/${req.file.filename}` : null;

  const sql = `INSERT INTO arizalar (demirbas_id, aciklama, bildiren_kisi, bildiren_tc, fotograf_url) VALUES ($1, $2, $3, $4, $5) RETURNING *`;

  try {
    const result = await db.query(sql, [demirbas_id, aciklama, bildiren_kisi, bildiren_tc, fotograf_url]);
    res.json({ id: result.rows[0].id, message: 'Arıza kaydı başarıyla oluşturuldu.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Arıza Durumunu Güncelle (Çözüldü / İşlemde)
app.put('/api/arizalar/:id', async (req, res) => {
  const { durum, cozum_notu } = req.body;
  const cozum_tarihi = durum === 'Çözüldü' ? new Date().toISOString() : null;
  const sql = `UPDATE arizalar SET durum = $1, cozum_notu = $2, cozum_tarihi = $3 WHERE id = $4`;

  try {
    await db.query(sql, [durum, cozum_notu, cozum_tarihi, req.params.id]);
    res.json({ message: 'Arıza durumu güncellendi.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Arıza Kaydını Sil
app.delete('/api/arizalar/:id', async (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM arizalar WHERE id = $1';

  try {
    await db.query(sql, [id]);
    res.json({ message: 'Arıza kaydı başarıyla silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Arıza kaydı silinirken bir hata oluştu.' });
  }
});

// 404 / Hatalı GET İSTEKLERİ İÇİN YAKALAYICI
app.use((req, res) => {
  res.status(404).json({ error: `Aradığınız yol (${req.originalUrl}) bulunamadı veya hatalı HTTP metodu kullanıldı.` });
});

// Sunucuyu Dinleme
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde CANLI dinliyor...`);
});