import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Building2, 
  PlusCircle, 
  QrCode, 
  Trash2, 
  Download, 
  Wrench, 
  CheckCircle2, 
  AlertCircle,
  Search
} from 'lucide-react';

const API_URL = 'https://demirbas-ariza-takip.onrender.com/api';

function AdminPaneli() {
  const [demirbaslar, setDemirbaslar] = useState([]);
  const [arizalar, setArizalar] = useState([]);
  const [aramaMetni, setAramaMetni] = useState('');
  const [seciliQR, setSeciliQR] = useState(null);

  const [yeniDemirbas, setYeniDemirbas] = useState({
    qr_kod: '',
    ad: '',
    kategori: '',
    birim: '',
    konum: '',
    alim_tarihi: ''
  });

  // Verileri Getir
  const verileriGetir = async () => {
    try {
      const [resDemirbas, resAriza] = await Promise.all([
        axios.get(`${API_URL}/demirbaslar`),
        axios.get(`${API_URL}/arizalar`)
      ]);
      setDemirbaslar(Array.isArray(resDemirbas.data) ? resDemirbas.data : []);
      setArizalar(Array.isArray(resAriza.data) ? resAriza.data : []);
    } catch (err) {
      console.error('Veri çekme hatası:', err);
    }
  };

  useEffect(() => {
    verileriGetir();
  }, []);

  // Yeni Demirbaş Ekleme
  const handleDemirbasEkle = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/demirbaslar`, yeniDemirbas);
      alert('Demirbaş başarıyla eklendi!');
      setYeniDemirbas({ qr_kod: '', ad: '', kategori: '', birim: '', konum: '', alim_tarihi: '' });
      verileriGetir();
    } catch (err) {
      alert('Eklenirken hata oluştu. QR Kodun benzersiz olduğundan emin olun.');
    }
  };

  // Demirbaş Silme
  const handleDemirbasSil = async (id) => {
    if (window.confirm('Bu demirbaşı silmek istediğinize emin misiniz?')) {
      try {
        await axios.delete(`${API_URL}/demirbaslar/${id}`);
        verileriGetir();
      } catch (err) {
        alert('Silme işlemi başarısız.');
      }
    }
  };

  // Arıza Durumu Güncelleme
  const handleArizaDurumGuncelle = async (id, yeniDurum) => {
    try {
      await axios.put(`${API_URL}/arizalar/${id}`, { durum: yeniDurum });
      verileriGetir();
    } catch (err) {
      alert('Durum güncellenemedi.');
    }
  };

  // MOBİL VE WEB UYUMLU QR KOD İNDİRME / AÇMA FONKSİYONU
  const handleQRDownload = (qrKod, ad) => {
    const svgElement = document.getElementById(`qr-svg-${qrKod}`);
    if (!svgElement) {
      alert('QR Kod yüklenemedi.');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 80;
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);

      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(ad, canvas.width / 2, canvas.height - 35);
      ctx.font = '12px Arial';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`QR: ${qrKod}`, canvas.width / 2, canvas.height - 15);

      const pngUrl = canvas.toDataURL('image/png');

      // Mobil WebView kısıtlamasını aşmak için resmi yeni pencerede gösterip kaydetme imkanı sunuyoruz
      const newWin = window.open('', '_blank');
      if (newWin) {
        newWin.document.write(`
          <html>
            <head>
              <title>${ad} - QR Kod</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#f8fafc; font-family:sans-serif; text-align:center; padding:20px;">
              <h3 style="color:#0f172a; margin-bottom:10px;">${ad}</h3>
              <p style="color:#64748b; font-size:14px; margin-bottom:20px;">Görsele basılı tutarak telefonunuza kaydedebilirsiniz.</p>
              <img src="${pngUrl}" alt="${ad} QR" style="max-width:100%; height:auto; border:1px solid #cbd5e1; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);" />
            </body>
          </html>
        `);
      } else {
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `QR_${qrKod}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const filtrelenmisDemirbaslar = demirbaslar.filter(d => 
    d.ad?.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    d.qr_kod?.toLowerCase().includes(aramaMetni.toLowerCase()) ||
    d.birim?.toLowerCase().includes(aramaMetni.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.mainTitle}>Ortahisar Belediyesi - Yönetici Paneli</h2>

      {/* YENİ DEMİRBAŞ EKLEME FORMU */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <PlusCircle size={20} color="#800020" />
          <h3 style={styles.cardTitle}>Yeni Demirbaş Ekle</h3>
        </div>
        <form onSubmit={handleDemirbasEkle} style={styles.formGrid}>
          <input
            type="text"
            placeholder="QR Kod (Örn: QR-1001)"
            value={yeniDemirbas.qr_kod}
            onChange={(e) => setYeniDemirbas({ ...yeniDemirbas, qr_kod: e.target.value })}
            required
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Demirbaş Adı"
            value={yeniDemirbas.ad}
            onChange={(e) => setYeniDemirbas({ ...yeniDemirbas, ad: e.target.value })}
            required
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Kategori"
            value={yeniDemirbas.kategori}
            onChange={(e) => setYeniDemirbas({ ...yeniDemirbas, kategori: e.target.value })}
            required
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Birim"
            value={yeniDemirbas.birim}
            onChange={(e) => setYeniDemirbas({ ...yeniDemirbas, birim: e.target.value })}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Konum"
            value={yeniDemirbas.konum}
            onChange={(e) => setYeniDemirbas({ ...yeniDemirbas, konum: e.target.value })}
            style={styles.input}
          />
          <input
            type="date"
            value={yeniDemirbas.alim_tarihi}
            onChange={(e) => setYeniDemirbas({ ...yeniDemirbas, alim_tarihi: e.target.value })}
            style={styles.input}
          />
          <button type="submit" style={styles.addBtn}>Demirbaş Kaydet</button>
        </form>
      </div>

      {/* DEMİRBAŞ LİSTESİ VE QR İNDİRME */}
      <div style={styles.card}>
        <div style={styles.cardHeaderBetween}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={20} color="#0284c7" />
            <h3 style={styles.cardTitle}>Kayıtlı Demirbaşlar ({filtrelenmisDemirbaslar.length})</h3>
          </div>
          <div style={styles.searchBox}>
            <Search size={16} color="#64748b" />
            <input 
              type="text" 
              placeholder="Ara (Ad, QR, Birim)..." 
              value={aramaMetni} 
              onChange={(e) => setAramaMetni(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>QR</th>
                <th style={styles.th}>Ad</th>
                <th style={styles.th}>Kategori</th>
                <th style={styles.th}>Birim / Konum</th>
                <th style={styles.th}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtrelenmisDemirbaslar.map((item) => (
                <tr key={item.id} style={styles.tableRow}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <QRCodeSVG 
                        id={`qr-svg-${item.qr_kod}`}
                        value={`https://demirbas-ariza-takip.onrender.com/demirbas/${item.id}`} 
                        size={60} 
                      />
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{item.qr_kod}</span>
                    </div>
                  </td>
                  <td style={styles.td}><strong>{item.ad}</strong></td>
                  <td style={styles.td}>{item.kategori}</td>
                  <td style={styles.td}>{item.birim || '-'} / {item.konum || '-'}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleQRDownload(item.qr_kod, item.ad)} 
                        style={styles.downloadBtn}
                        title="QR Kodu İndir / Kaydet"
                      >
                        <Download size={14} /> QR İndir
                      </button>
                      <button 
                        onClick={() => handleDemirbasSil(item.id)} 
                        style={styles.deleteBtn}
                        title="Demirbaşı Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' },
  mainTitle: { color: '#0f172a', fontSize: '1.4rem', fontWeight: '800', marginBottom: '20px' },
  card: { background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' },
  cardHeaderBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' },
  cardTitle: { margin: 0, fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' },
  addBtn: { background: '#16a34a', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', gridColumn: '1 / -1' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  tableHeaderRow: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '12px', fontSize: '0.82rem', color: '#475569', fontWeight: 'bold' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px', fontSize: '0.88rem', color: '#0f172a' },
  downloadBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: '#0284c7', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: '600' },
  deleteBtn: { background: '#ef4444', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: '6px', cursor: 'pointer' }
};

export default AdminPaneli;