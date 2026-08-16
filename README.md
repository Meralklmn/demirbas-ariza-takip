 Trabzon Ortahisar Belediyesi - Demirbaş & Arıza Takip Sistemi

Trabzon Ortahisar Belediyesi Bilgi İşlem Müdürlüğü bünyesinde kullanılmak üzere geliştirilmiş, belediye envanterindeki demirbaşların yönetimini ve birimlerden gelen arıza taleplerinin uçtan uca takibini sağlayan **Web ve Mobil (Android)** tabanlı otomasyon sistemidir.

---

##  Proje Hakkında ve Problem Tanımı

Kurum bünyesindeki birimlerde bulunan bilgisayar, yazıcı, tarayıcı ve çevre birimleri gibi cihazlar arızalandığında; sözlü veya telefonla yapılan bildirimler iletişim kopukluklarına, teknik ekibin iş planlamasında aksaklıklara ve geçmiş arıza kayıtlarının takip edilememesine yol açmaktaydı. 

Bu sorunu çözmek amacıyla;
- **Personelin** arızalı cihazı seçip açıklama ve fotoğraf ekleyerek anında kayıt açabildiği,
- **Teknik Ekip / Yöneticinin (Admin)** tüm kurum envanterini yönetebildiği, gelen arıza durumlarını (*Beklemede*, *İşlemde*, *Çözüldü*) güncelleyip personele çözüm notu iletebildiği,
- İstatistik sayaç kartları (Dashboard) ile anlık durumun izlenebildiği,
- Hem masaüstü web tarayıcılarından hem de sahada Android mobil uygulaması üzerinden erişilebilen tek kod tabanlı (*single codebase*) bir sistem geliştirilmiştir.

---

## Teknolojik Mimari & Kullanılan Araçlar

### **Frontend & Mobil**
- **React (Vite):** Hızlı, modüler ve bileşen tabanlı (Component Architecture) kullanıcı arayüzü.
- **Capacitor (@capacitor/core, @capacitor/android):** Web uygulamasını yerel (native) Android platformuna dönüştüren köprüleme mimarisi.
- **Android Studio & Gradle:** Android APK derleme, izin ve kaynak yönetimi (`res/mipmap`, `drawable`).
- **Responsive CSS & Flexbox:** Mobil ve masaüstü ekran boyutlarına tam uyumlu arayüz.
- **LocalStorage:** Rol tabanlı oturum durumunun güvenli yönetimi.

### **Backend & API**
- **Node.js & Express.js:** RESTful API servisleri ve istek yönetimi.
- **Multer Middleware:** Arıza görsellerinin yüklenmesi ve `multipart/form-data` dosya yönetimi.
- **CORS:** Güvenli çapraz kaynak paylaşımı yapılandırması.
- **dotenv:** Ortam değişkenlerinin (`.env`) ve gizli verilerin güvenliği.

### **Veritabanı & Bulut Dağıtımı (Deployment)**
- **PostgreSQL (Neon.tech):** Bulut tabanlı, kalıcı ilişkisel veritabanı.
- **Render:** Backend servislerinin 7/24 kesintisiz canlıya alındığı bulut barındırma platformu.
- **Git & GitHub:** Versiyon kontrolü ve sürekli dağıtım (Continuous Deployment) akışı.

---

##  Veritabanı Şeması

Sistemde 3 ana ilişkisel tablo bulunmaktadır:

```sql
-- Kullanıcılar Tablosu
CREATE TABLE kullanicilar (
    id SERIAL PRIMARY KEY,
    tc_no VARCHAR(11) UNIQUE NOT NULL,
    ad_soyad VARCHAR(100) NOT NULL,
    rol VARCHAR(20) DEFAULT 'personel' -- 'personel' veya 'admin'
);

-- Demirbaşlar Tablosu
CREATE TABLE demirbaslar (
    id SERIAL PRIMARY KEY,
    kod VARCHAR(50) UNIQUE NOT NULL, -- Demirbaş / Seri No
    ad VARCHAR(100) NOT NULL,
    kategori VARCHAR(50),
    birim VARCHAR(100),
    konum VARCHAR(100)
);

-- Arızalar Tablosu
CREATE TABLE arizalar (
    id SERIAL PRIMARY KEY,
    demirbas_id INTEGER REFERENCES demirbaslar(id) ON DELETE CASCADE,
    bildiren_tc VARCHAR(11) NOT NULL,
    aciklama TEXT NOT NULL,
    fotograf_url VARCHAR(255),
    durum VARCHAR(20) DEFAULT 'Beklemede', -- 'Beklemede', 'İşlemde', 'Çözüldü'
    cozum_notu TEXT,
    olusturulma_tarihi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

##  API Uç Noktaları (Endpoints)

### **Kullanıcı Yönetimi**
| Metot | Uç Nokta | Açıklama |
| :--- | :--- | :--- |
| `POST` | `/api/register` | Yeni kullanıcı kaydı oluşturur. |
| `POST` | `/api/login` | T.C. Kimlik No ile doğrulama ve rol yönlendirmesi yapar. |
| `GET` | `/api/kullanicilar` | Kayıtlı kullanıcıları listeler. |
| `DELETE` | `/api/kullanicilar/:id` | Kullanıcı hesabını sistemden siler. |

### **Demirbaş Yönetimi**
| Metot | Uç Nokta | Açıklama |
| :--- | :--- | :--- |
| `GET` | `/api/demirbaslar` | Tüm demirbaş cihazları listeler. |
| `POST` | `/api/demirbaslar` | Envantere yeni demirbaş ekler. |
| `DELETE` | `/api/demirbaslar/:id` | Seçilen demirbaşı envanterden siler. |

### **Arıza Takip Modülü**
| Metot | Uç Nokta | Açıklama |
| :--- | :--- | :--- |
| `GET` | `/api/arizalar` | Tüm arıza kayıtlarını listeler (Admin). |
| `GET` | `/api/arizalar/kullanici/:tc_no` | İlgili personelin bildirdiği geçmiş arızaları listeler. |
| `POST` | `/api/arizalar` | Fotoğraf desteğiyle yeni arıza kaydı açar. |
| `PUT` | `/api/arizalar/:id` | Arıza durumunu günceller ve çözüm notu ekler. |

---

##  Kurulum ve Yerel Geliştirme

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları takip edebilirsiniz:

### 1. Depoyu Klonlayın
```bash
git clone https://github.com/Meralklmn/demirbas-ariza-takip.git
cd demirbas-ariza-takip
```

### 2. Backend Kurulumu
```bash
cd backend
npm install
```

`backend` dizininde `.env` dosyası oluşturup değişkenleri tanımlayın:
```env
PORT=3001
DATABASE_URL=postgresql://kullanici:sifre@ep-xyz.neon.tech/dbname?sslmode=require
```

Sunucuyu başlatın:
```bash
npm start
# veya geliştirme modu için:
node index.js
```

### 3. Frontend Kurulumu
```bash
cd ../frontend
npm install
npm run dev
```
Uygulama varsayılan olarak `http://localhost:5173` adresinde çalışacaktır.

### 4. Mobil (Android) Çıktısı Alma
```bash
# Frontend build üretin
npm run build

# Capacitor ile Android dizinine aktarın
npx cap sync android

# Android Studio'yu açın
npx cap open android
```
Android Studio üzerinden **Build > Build Bundle(s) / APK(s) > Build APK(s)** adımıyla `.apk` kurulum dosyasını üretebilirsiniz.

---

## Mobil Uygulama & Kurumsal Kimlik

- Uygulama simgesi (App Icon) ve arayüz teması Trabzon Ortahisar Belediyesi'nin kurumsal kimliğine uygun olarak **Bordo & Mavi** tonlarında tasarlanmıştır.
- Mobil uygulama, hücresel mobil veri (4.5G/5G) üzerinden doğrudan Render üzerinde barındırılan canlı PostgreSQL API'sine bağlanmaktadır.

---

##  Geliştirici

**Meral KÖLEMEN**  
Fırat Üniversitesi Teknoloji Fakültesi - Yazılım Mühendisliği  
*Ortahisar Belediyesi Bilgi İşlem Müdürlüğü Staj Projesi (2026)*
