import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, 
  QrCode, 
  Wrench, 
  History, 
  User, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Send,
  ImageIcon
} from 'lucide-react';

const API_URL = 'https://demirbas-ariza-takip.onrender.com/api';

function DemirbasDetay() {
  const { id } = useParams();
  const [demirbas, setDemirbas] = useState(null);
  const [arizalar, setArizalar] = useState([]);
  const [aciklama, setAciklama] = useState('');
  const [bildirenKisi, setBildirenKisi] = useState(localStorage.getItem('userName') || '');
  const [fotograf, setFotograf] = useState(null);
  const [mesaj, setMesaj] = useState('');
  const [loading, setLoading] = useState(true);

  // Verileri Getir
  const verileriGetir = useCallback(async () => {
    try {
      const [resDemirbas, resArizalar] = await Promise.all([
        axios.get(`${API_URL}/demirbaslar/${id}`),
        axios.get(`${API_URL}/arizalar/demirbas/${id}`)
      ]);

      setDemirbas(resDemirbas.data);
      setArizalar(Array.isArray(resArizalar.data) ? resArizalar.data : []);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    verileriGetir();
  }, [verileriGetir]);

  const handleArizaSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('demirbas_id', id);
    formData.append('aciklama', aciklama);
    formData.append('bildiren_kisi', bildirenKisi);
    if (fotograf) formData.append('fotograf', fotograf);

    try {
      await axios.post(`${API_URL}/arizalar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMesaj('Arıza kaydı başarıyla gönderildi!');
      setAciklama(''); 
      setFotograf(null);
      verileriGetir();
      setTimeout(() => setMesaj(''), 5000);
    } catch (err) {
      console.error('Form gönderim hatası:', err);
      alert('Gönderim sırasında bir hata oluştu.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <Clock size={32} color="#0284c7" style={{ marginBottom: '10px' }} />
        <div>Demirbaş detayları yükleniyor...</div>
      </div>
    );
  }

  if (!demirbas) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>
        <AlertCircle size={32} style={{ marginBottom: '10px' }} />
        <div>Demirbaş bulunamadı veya silinmiş.</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      
      {/* KURUMSAL BAŞLIK VE DEMİRBAŞ ÖZET KARTI */}
      <div style={styles.card}>
        <div style={styles.headerTitleGroup}>
          <div style={styles.iconBg}>
            <Building2 size={24} color="#800020" />
          </div>
          <div>
            <span style={styles.subTag}>Ortahisar Belediyesi</span>
            <h2 style={styles.deviceTitle}>{demirbas.ad}</h2>
          </div>
        </div>

        <div style={styles.infoGrid}>
          <div style={styles.infoBox}>
            <QrCode size={16} color="#0284c7" />
            <div>
              <span style={styles.infoLabel}>QR / Barkod Kodu</span>
              <strong style={styles.infoVal}>{demirbas.qr_kod}</strong>
            </div>
          </div>

          <div style={styles.infoBox}>
            <FileText size={16} color="#64748b" />
            <div>
              <span style={styles.infoLabel}>Kategori</span>
              <strong style={styles.infoVal}>{demirbas.kategori || '-'}</strong>
            </div>
          </div>

          <div style={styles.infoBox}>
            <Wrench size={16} color="#d97706" />
            <div>
              <span style={styles.infoLabel}>Birim / Konum</span>
              <strong style={styles.infoVal}>{demirbas.birim || '-'} / {demirbas.konum || '-'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ARIZA BİLDİRİM FORMU */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <Wrench size={18} color="#dc2626" />
          <h3 style={styles.cardTitle}>Bu Demirbaş İçin Arıza Bildir</h3>
        </div>

        {mesaj && (
          <div style={styles.successBox}>
            <CheckCircle2 size={18} color="#15803d" />
            <span>{mesaj}</span>
          </div>
        )}

        <form onSubmit={handleArizaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={styles.label}>
              <User size={14} color="#64748b" /> Adınız Soyadınız / Biriminiz:
            </label>
            <input 
              type="text" 
              value={bildirenKisi} 
              onChange={(e) => setBildirenKisi(e.target.value)} 
              required 
              placeholder="Örn: Ahmet Yılmaz"
              style={styles.input} 
            />
          </div>

          <div>
            <label style={styles.label}>
              <FileText size={14} color="#64748b" /> Arıza Açıklaması:
            </label>
            <textarea 
              value={aciklama} 
              onChange={(e) => setAciklama(e.target.value)} 
              required 
              placeholder="Cihazdaki arızayı kısaca açıklayınız..."
              style={styles.textarea} 
            />
          </div>

          <div>
            <label style={styles.label}>Fotoğraf Ekle (Opsiyonel):</label>
            <div style={styles.fileUploadBox}>
              <ImageIcon size={18} color="#64748b" />
              <input 
                type="file" 
                onChange={(e) => setFotograf(e.target.files[0])} 
                accept="image/*" 
                style={{ fontSize: '0.85rem', color: '#475569' }}
              />
            </div>
          </div>

          <button type="submit" style={styles.submitBtn}>
            <Send size={16} /> Arızayı Bildir
          </button>
        </form>
      </div>

      {/* GEÇMİŞ ARIZA KAYITLARI */}
      <div style={styles.card}>
        <div style={styles.cardHeaderBetween}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="#0284c7" />
            <h3 style={styles.cardTitle}>Cihazın Geçmiş Arıza Kayıtları</h3>
          </div>
          <span style={styles.countBadgeMini}>{arizalar.length} Kayıt</span>
        </div>

        {arizalar.length === 0 ? (
          <div style={styles.emptyBox}>
            <CheckCircle2 size={24} color="#16a34a" style={{ marginBottom: '6px' }} />
            <div>Bu demirbaşa ait geçmiş arıza kaydı bulunmamaktadır.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {arizalar.map(a => (
              <div key={a.id} style={styles.historyCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{
                    ...styles.statusBadge,
                    ...(a.durum === 'Çözüldü' ? styles.statusGreen : 
                       a.durum === 'İşlemde' ? styles.statusBlue : styles.statusAmber)
                  }}>
                    {a.durum || 'Beklemede'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {a.bildirim_tarihi ? new Date(a.bildirim_tarihi).toLocaleString('tr-TR') : '-'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#0f172a', fontWeight: '500', marginBottom: '6px' }}>
                  {a.aciklama}
                </div>
                {a.cozum_notu && (
                  <div style={{ fontSize: '0.82rem', color: '#15803d', background: '#dcfce7', padding: '6px 10px', borderRadius: '6px', marginTop: '6px' }}>
                    <strong>Çözüm Notu:</strong> {a.cozum_notu}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

// STİL TABLOSU (STYLES)
const styles = {
  container: {
    maxWidth: '750px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box'
  },
  card: {
    background: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    marginBottom: '20px'
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '16px',
    marginBottom: '16px'
  },
  iconBg: {
    background: '#fdf2f2',
    padding: '12px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  subTag: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#800020',
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  deviceTitle: {
    margin: '2px 0 0 0',
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#0f172a'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px'
  },
  infoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#f8fafc',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0'
  },
  infoLabel: {
    display: 'block',
    fontSize: '0.72rem',
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  infoVal: {
    fontSize: '0.88rem',
    color: '#0f172a'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '18px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '10px'
  },
  cardHeaderBetween: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '18px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '10px'
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: '700',
    color: '#0f172a'
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#334155',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '11px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.88rem',
    backgroundColor: '#f8fafc',
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '11px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.88rem',
    minHeight: '80px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    backgroundColor: '#f8fafc'
  },
  fileUploadBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: '#f8fafc',
    border: '1px dashed #cbd5e1',
    borderRadius: '10px'
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    background: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '6px'
  },
  successBox: {
    background: '#dcfce7',
    color: '#15803d',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  emptyBox: {
    textAlign: 'center',
    padding: '24px',
    color: '#15803d',
    background: '#dcfce7',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '600'
  },
  historyCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px 14px'
  },
  statusBadge: {
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '0.72rem',
    fontWeight: '700'
  },
  statusGreen: { background: '#dcfce7', color: '#15803d' },
  statusBlue: { background: '#e0f2fe', color: '#0369a1' },
  statusAmber: { background: '#fef3c7', color: '#b45309' },
  countBadgeMini: {
    background: '#f1f5f9',
    color: '#475569',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '0.78rem',
    fontWeight: '700'
  }
};

export default DemirbasDetay;