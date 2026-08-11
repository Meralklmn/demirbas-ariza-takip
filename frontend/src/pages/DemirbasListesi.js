import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DemirbasListesi() {
  const [demirbaslar, setDemirbaslar] = useState([]);
  const [yeniDemirbas, setYeniDemirbas] = useState({
    qr_kod: '',
    ad: '',
    kategori: '',
    birim: '',
    konum: '',
    alim_tarihi: ''
  });

  const demirbaslariGetir = async () => {
    try {
      const response = await axios.get('https://demirbas-ariza-takip.onrender.com/api/demirbaslar');
      setDemirbaslar(response.data);
    } catch (error) {
      console.error('Veriler çekilirken hata oluştu:', error);
    }
  };

  useEffect(() => {
    demirbaslariGetir();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://demirbas-ariza-takip.onrender.com/api/demirbaslar', yeniDemirbas);
      setYeniDemirbas({ qr_kod: '', ad: '', kategori: '', birim: '', konum: '', alim_tarihi: '' });
      demirbaslariGetir();
    } catch (error) {
      alert('Demirbaş eklenirken hata oluştu! QR Kodun benzersiz olduğundan emin olun.');
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Arial, sans-serif' }}>
      <h2> Ortahisar Belediyesi - Demirbaş Takibi</h2>

      {/* Yeni Demirbaş Formu */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
        <h3>Yeni Demirbaş Kaydı</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="QR Kod (Örn: QR-1001)"
            value={yeniDemirbas.qr_kod}
            onChange={(e) => setYeniDemirbas({ ...yeniDemirbas, qr_kod: e.target.value })}
            required
            style={{ padding: '8px' }}
          />
          <input
            type="text"
            placeholder="Demirbaş Adı"
            value={yeniDemirbas.ad}
            onChange={(e) => setYeniDemirbas({ ...yeniDemirbas, ad: e.target.value })}
            required
            style={{ padding: '8px' }}
          />
          <input
            type="text"
            placeholder="Kategori (Örn: Bilgisayar)"
            value={yeniDemirbas.kategori}
            onChange={(e) => setYeniDemirbas({ ...yeniDemirbas, kategori: e.target.value })}
            required
            style={{ padding: '8px' }}
          />
          <input
            type="text"
            placeholder="Birim (Örn: Bilgi İşlem)"
            value={yeniDemirbas.birim}
            onChange={(e) => setYeniDemirbas({ ...yeniDemirbas, birim: e.target.value })}
            style={{ padding: '8px' }}
          />
          <input
            type="text"
            placeholder="Konum (Örn: Kat 2 / Oda 204)"
            value={yeniDemirbas.konum}
            onChange={(e) => setYeniDemirbas({ ...yeniDemirbas, konum: e.target.value })}
            style={{ padding: '8px' }}
          />
          <input
            type="date"
            placeholder="Alım Tarihi"
            value={yeniDemirbas.alim_tarihi}
            onChange={(e) => setYeniDemirbas({ ...yeniDemirbas, alim_tarihi: e.target.value })}
            style={{ padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Demirbaş Ekle
        </button>
      </form>

      {/* Tablo */}
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#e9ecef' }}>
            <th>ID</th>
            <th>QR Kod</th>
            <th>Ad</th>
            <th>Kategori</th>
            <th>Birim</th>
            <th>Konum</th>
            <th>Alım Tarihi</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {demirbaslar.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td><strong>{item.qr_kod}</strong></td>
              <td>{item.ad}</td>
              <td>{item.kategori}</td>
              <td>{item.birim || '-'}</td>
              <td>{item.konum || '-'}</td>
              <td>{item.alim_tarihi || '-'}</td>
              <td>{item.durum}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DemirbasListesi;