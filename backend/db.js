const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Veritabanına bağlanırken hata oluştu:', err.message);
  } else {
    console.log('SQLite veritabanına başarıyla bağlandı.');
  }
});

db.serialize(() => {
  // 1. Demirbaşlar Tablosu
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

  // 2. Arızalar Tablosu
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

// Sadece dışarıya aktarıyoruz, db.close() KESİNLİKLE OLMAMALI!
module.exports = db;