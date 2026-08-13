require('dotenv').config();
const { Pool } = require('pg');

// .env dosyasındaki DATABASE_URL bilgisini okur
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Neon ve bulut PostgreSQL bağlantıları için şarttır
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('PostgreSQL veritabanına bağlanırken hata oluştu:', err.stack);
  } else {
    console.log('PostgreSQL veritabanına başarıyla bağlandı.');
    release();
  }
});

// Tabloları asenkron olarak sırayla oluşturan fonksiyon
const initDb = async () => {
  try {
    // 1. Demirbaşlar Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS demirbaslar (
        id SERIAL PRIMARY KEY,
        qr_kod VARCHAR(20) UNIQUE NOT NULL,
        ad VARCHAR(100) NOT NULL,
        kategori VARCHAR(50) NOT NULL,
        birim VARCHAR(100),
        konum VARCHAR(150),
        alim_tarihi DATE,
        durum VARCHAR(20) DEFAULT 'Aktif',
        olusturma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Arızalar Tablosu
    await pool.query(`
      CREATE TABLE IF NOT EXISTS arizalar (
        id SERIAL PRIMARY KEY,
        demirbas_id INTEGER NOT NULL,
        aciklama TEXT NOT NULL,
        bildiren_kisi VARCHAR(100),
        bildirim_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fotograf_url VARCHAR(255),
        durum VARCHAR(20) DEFAULT 'Açık',
        cozum_notu TEXT,
        cozum_tarihi TIMESTAMP,
        CONSTRAINT fk_demirbas FOREIGN KEY (demirbas_id) REFERENCES demirbaslar(id) ON DELETE CASCADE
      );
    `);

    console.log('PostgreSQL tabloları başarıyla kontrol edildi/oluşturuldu.');
  } catch (err) {
    console.error('Tablo oluşturma hatası:', err.message);
  }
};

initDb();

module.exports = pool;