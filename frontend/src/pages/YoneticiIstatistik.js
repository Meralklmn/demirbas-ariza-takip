import React, { useState, useEffect } from 'react';
import axios from 'axios';

function YoneticiIstatistik() {
  const [istatistik, setIstatistik] = useState([]);

  useEffect(() => {
    axios.get('https://demirbas-ariza-takip.onrender.com/api/istatistikler')
      .then(res => setIstatistik(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>Yönetici Analiz & İstatistik Paneli</h2>
      <p style={{ color: '#666' }}>Bu sayfa sadece yetkili teknik birim ve yöneticiler tarafından görüntülenebilir.</p>

      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '20px' }}>
        <h3>En Sık Arızalanan Demirbaşlar Top 5</h3>
        {istatistik.length === 0 ? (
          <p>Henüz analiz edilecek veri bulunmuyor.</p>
        ) : (
          <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
            <thead style={{ background: '#003366', color: '#fff' }}>
              <tr>
                <th>Sıra</th>
                <th>Demirbaş Adı</th>
                <th>Toplam Arıza Sayısı</th>
              </tr>
            </thead>
            <tbody>
              {istatistik.map((item, index) => (
                <tr key={index}>
                  <td><strong>#{index + 1}</strong></td>
                  <td>{item.ad}</td>
                  <td><span style={{ color: 'red', fontWeight: 'bold' }}>{item.ariza_sayisi} Arıza</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default YoneticiIstatistik;