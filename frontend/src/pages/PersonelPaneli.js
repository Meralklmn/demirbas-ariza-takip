import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'react-toastify';
import { 
  AlertCircle, 
  QrCode, 
  ListFilter, 
  Camera, 
  Upload, 
  CheckCircle2, 
  Clock, 
  Send, 
  User, 
  History, 
  CheckCircle,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

const API_URL = 'https://demirbas-ariza-takip.onrender.com/api';

function PersonelPaneli() {
  const [userName] = useState(localStorage.getItem('userName') || 'Personel');
  const [demirbaslar, setDemirbaslar] = useState([]);
  const [arizalar, setArizalar] = useState([]);
  const [loading, setLoading] = useState(true);

  // Aktif Sekme / Mod ('bildir' | 'gecmis')
  const [aktifMod, setAktifMod] = useState('bildir');

  // Form State'leri
  const [secimYontemi, setSecimYontemi] = useState('qr');
  const [secilenDemirbasId, setSecilenDemirbasId] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [fotograf, setFotograf] = useState(null);
  const [kameraAcik, setKameraAcik] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  // Verileri Çek
  const verileriGetir = useCallback(async () => {
    try {
      const [resD, resA] = await Promise.all([
        axios.get(`${API_URL}/demirbaslar`),
        axios.get(`${API_URL}/arizalar`)
      ]);

      setDemirbaslar(Array.isArray(resD.data) ? resD.data : []);
      setArizalar(Array.isArray(resA.data) ? resA.data : []);
    } catch (err) {
      console.error('Veri çekme hatası:', err);
      toast.error('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verileriGetir();
  }, [verileriGetir]);

  // QR KOD OKUYUCU MANTIĞI
  useEffect(() => {
    let scanner = null;
    if (aktifMod === 'bildir' && secimYontemi === 'qr' && kameraAcik) {
      scanner = new Html5QrcodeScanner(
        "personel-qr-reader",
        { fps: 10, qrbox: { width: 200, height: 200 } },
        false
      );

      scanner.render(
        (decodedText) => {
          let okunanQR = decodedText.trim();
          if (okunanQR.includes('/demirbas/')) {
            const parts = okunanQR.split('/demirbas/');
            setSecilenDemirbasId(parts[parts.length - 1]);
            toast.success('Demirbaş QR doğrulandı.');
          } else {
            const eslesen = demirbaslar.find(d => d.qr_kod === okunanQR || d.id.toString() === okunanQR);
            if (eslesen) {
              setSecilenDemirbasId(eslesen.id.toString());
              toast.success(`${eslesen.ad} seçildi.`);
            } else {
              toast.error(`"${okunanQR}" QR koduna ait demirbaş bulunamadı.`);
            }
          }
          scanner.clear();
          setKameraAcik(false);
        },
        () => {}
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error(e));
      }
    };
  }, [kameraAcik, secimYontemi, demirbaslar, aktifMod]);

  const handleYontemChange = (yontem) => {
    setSecimYontemi(yontem);
    setSecilenDemirbasId('');
    setKameraAcik(false);
  };

  // ARIZA KAYDI GÖNDERME
  const handleArizaGonder = async (e) => {
    e.preventDefault();

    if (!secilenDemirbasId) {
      toast.warning('Lütfen arızalı cihazı QR okutarak veya listeden seçin.');
      return;
    }

    if (!aciklama.trim()) {
      toast.warning('Lütfen arıza açıklamasını doldurunuz.');
      return;
    }

    setGonderiliyor(true);

    const formData = new FormData();
    formData.append('demirbas_id', secilenDemirbasId);
    formData.append('aciklama', aciklama);
    formData.append('bildiren_kisi', userName);
    if (fotograf) {
      formData.append('fotograf', fotograf);
    }

    try {
      await axios.post(`${API_URL}/arizalar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Arıza bildirimi teknik ekibe iletildi.');
      setAciklama('');
      setFotograf(null);
      setSecilenDemirbasId('');
      verileriGetir();
      setAktifMod('gecmis');
    } catch (err) {
      console.error('Gönderim hatası:', err);
      toast.error('Arıza kaydı gönderilirken bir hata oluştu.');
    } finally {
      setGonderiliyor(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b' }}>
        <Clock size={32} color="#800020" style={{ marginBottom: '10px' }} />
        <div style={{ fontWeight: '600' }}>Panel Yükleniyor...</div>
      </div>
    );
  }

  const seciliDemirbas = demirbaslar.find(d => d.id.toString() === secilenDemirbasId.toString());
  const benimArizalarim = arizalar.filter(a => a.bildiren_kisi === userName || !a.bildiren_kisi);

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      
      {/* KARŞILAMA KARTI */}
      <div style={styles.userCard}>
        <div style={styles.userAvatar}>
          <User size={22} color="#800020" />
        </div>
        <div>
          <h2 style={styles.userNameText}>Selam, {userName}</h2>
          <span style={styles.userRoleText}>Saha Personeli • Arıza Bildirim Ekranı</span>
        </div>
      </div>

      {/* MOBİL SEKME BUTONLARI */}
      <div style={styles.tabGrid}>
        <button 
          onClick={() => setAktifMod('bildir')}
          style={{
            ...styles.tabBtn,
            ...(aktifMod === 'bildir' ? styles.activeTabBtn : {})
          }}
        >
          <AlertCircle size={16} /> Arıza Bildir
        </button>

        <button 
          onClick={() => setAktifMod('gecmis')}
          style={{
            ...styles.tabBtn,
            ...(aktifMod === 'gecmis' ? styles.activeTabBtn : {})
          }}
        >
          <History size={16} /> Kayıtlarım ({benimArizalarim.length})
        </button>
      </div>

      {/* 1. SEKME: ARIZA BİLDİRİM FORMU */}
      {aktifMod === 'bildir' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Yeni Arıza Bildirimi</h3>

          <form onSubmit={handleArizaGonder} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
            
            {/* Seçim Yöntemi */}
            <div>
              <label style={styles.label}>1. Cihaz Doğrulama Yöntemi</label>
              <div style={styles.subTabGrid}>
                <button
                  type="button"
                  onClick={() => handleYontemChange('qr')}
                  style={{
                    ...styles.subTabBtn,
                    ...(secimYontemi === 'qr' ? styles.activeSubTab : {})
                  }}
                >
                  <QrCode size={15} /> QR Okut
                </button>
                <button
                  type="button"
                  onClick={() => handleYontemChange('manual')}
                  style={{
                    ...styles.subTabBtn,
                    ...(secimYontemi === 'manual' ? styles.activeSubTab : {})
                  }}
                >
                  <ListFilter size={15} /> Listeden Seç
                </button>
              </div>
            </div>

            {/* QR Kamera Alanı */}
            {secimYontemi === 'qr' && (
              <div style={styles.boxWrapper}>
                <button 
                  type="button" 
                  onClick={() => setKameraAcik(!kameraAcik)}
                  style={{
                    ...styles.cameraBtn,
                    background: kameraAcik ? '#ef4444' : '#0f172a'
                  }}
                >
                  <Camera size={18} /> {kameraAcik ? 'Kamerayı Kapat' : 'Kamerayı Aç & QR Tara'}
                </button>

                {kameraAcik && (
                  <div style={styles.qrReaderBox}>
                    <div id="personel-qr-reader" style={{ width: '100%' }}></div>
                  </div>
                )}
              </div>
            )}

            {/* Manuel Seçim Alanı */}
            {secimYontemi === 'manual' && (
              <div style={styles.boxWrapper}>
                <select 
                  value={secilenDemirbasId} 
                  onChange={(e) => setSecilenDemirbasId(e.target.value)} 
                  style={styles.mobileSelect}
                >
                  <option value="">-- Arızalı Cihazı Seçin --</option>
                  {demirbaslar.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.ad} (QR: {d.qr_kod})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* SEÇİLEN DEMİRBAŞ ONAY KARTI */}
            {seciliDemirbas && (
              <div style={styles.selectedBox}>
                <CheckCircle size={20} color="#15803d" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: '700', color: '#14532d', fontSize: '0.9rem' }}>{seciliDemirbas.ad}</div>
                  <div style={{ fontSize: '0.75rem', color: '#166534' }}>Kod: {seciliDemirbas.qr_kod} | Birim: {seciliDemirbas.birim || 'Genel'}</div>
                </div>
              </div>
            )}

            {/* Açıklama */}
            <div>
              <label style={styles.label}>2. Arıza Detayı</label>
              <textarea 
                rows="3" 
                placeholder="Yaşanan sorunu kısaca açıklayın..." 
                value={aciklama} 
                onChange={e => setAciklama(e.target.value)} 
                required 
                style={styles.mobileTextarea} 
              />
            </div>

            {/* Görsel Yükleme */}
            <div>
              <label style={styles.label}>3. Fotoğraf Ekle (Opsiyonel)</label>
              <label style={styles.fileLabel}>
                <Upload size={18} color="#64748b" />
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>
                  {fotograf ? fotograf.name : 'Fotoğraf Çek / Dosya Seç'}
                </span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setFotograf(e.target.files[0])} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>

            {/* Gönder Butonu */}
            <button 
              type="submit" 
              disabled={gonderiliyor}
              style={{
                ...styles.submitBtn,
                opacity: gonderiliyor ? 0.7 : 1
              }}
            >
              <Send size={18} /> {gonderiliyor ? 'Gönderiliyor...' : 'Arıza Kaydını Gönder'}
            </button>

          </form>
        </div>
      )}

      {/* 2. SEKME: BİLDİRDİĞİM ARIZA KAYITLARI (MOBİL DİKEY KARTLAR) */}
      {aktifMod === 'gecmis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {benimArizalarim.length === 0 ? (
            <div style={styles.emptyCard}>Bildirdiğiniz aktif arıza kaydı yok.</div>
          ) : (
            benimArizalarim.map(a => (
              <div key={a.id} style={styles.historyCard}>
                <div style={styles.historyCardHeader}>
                  <div style={{ fontWeight: '700', fontSize: '0.92rem', color: '#0f172a' }}>
                    {a.demirbas_adi || `Demirbaş #${a.demirbas_id}`}
                  </div>
                  <span style={{
                    ...styles.statusBadge,
                    ...(a.durum === 'Çözüldü' ? styles.statusGreen : 
                        a.durum === 'İşlemde' ? styles.statusBlue : styles.statusAmber)
                  }}>
                    {a.durum === 'Çözüldü' && <CheckCircle2 size={12} />}
                    {a.durum === 'İşlemde' && <AlertTriangle size={12} />}
                    {a.durum || 'Beklemede'}
                  </span>
                </div>

                <div style={styles.historyCardBody}>
                  <p style={{ margin: '4px 0 8px 0', fontSize: '0.85rem', color: '#334155' }}>{a.aciklama}</p>
                  
                  {a.cozum_notu && (
                    <div style={styles.solutionNote}>
                      <strong>Çözüm Notu:</strong> {a.cozum_notu}
                    </div>
                  )}

                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px' }}>
                    Tarih: {a.bildirim_tarihi ? new Date(a.bildirim_tarihi).toLocaleDateString('tr-TR') : '-'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}

const styles = {
  userCard: {
    background: '#ffffff',
    padding: '14px 16px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px'
  },
  userAvatar: {
    background: '#fdf2f2',
    padding: '10px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justify: 'center'
  },
  userNameText: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '800',
    color: '#0f172a'
  },
  userRoleText: {
    fontSize: '0.75rem',
    color: '#64748b'
  },
  tabGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    background: '#ffffff',
    padding: '6px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    marginBottom: '14px'
  },
  tabBtn: {
    padding: '12px',
    border: 'none',
    background: 'transparent',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justify: 'center',
    gap: '6px'
  },
  activeTabBtn: {
    background: '#800020',
    color: '#ffffff',
    boxShadow: '0 2px 6px rgba(128,0,32,0.2)'
  },
  card: {
    background: '#ffffff',
    padding: '18px 16px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
  },
  cardTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '800',
    color: '#0f172a',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '10px'
  },
  label: {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '6px',
    textTransform: 'uppercase'
  },
  subTabGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    background: '#f1f5f9',
    padding: '4px',
    borderRadius: '10px'
  },
  subTabBtn: {
    padding: '10px',
    border: 'none',
    background: 'transparent',
    borderRadius: '8px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justify: 'center',
    gap: '6px'
  },
  activeSubTab: {
    background: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
  },
  boxWrapper: {
    background: '#f8fafc',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  cameraBtn: {
    width: '100%',
    padding: '12px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justify: 'center',
    gap: '8px'
  },
  qrReaderBox: {
    marginTop: '10px',
    background: '#ffffff',
    padding: '8px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1'
  },
  mobileSelect: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.88rem',
    backgroundColor: '#ffffff',
    outline: 'none'
  },
  selectedBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  mobileTextarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '0.9rem',
    backgroundColor: '#f8fafc',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  fileLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#f8fafc',
    padding: '12px',
    borderRadius: '10px',
    border: '1.5px dashed #cbd5e1',
    cursor: 'pointer'
  },
  submitBtn: {
    width: '100%',
    padding: '15px',
    background: '#800020',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.95rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justify: 'center',
    gap: '8px'
  },
  historyCard: {
    background: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '14px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
  },
  historyCardHeader: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '8px'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.72rem',
    fontWeight: '700',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  statusGreen: { background: '#dcfce7', color: '#15803d' },
  statusBlue: { background: '#e0f2fe', color: '#0369a1' },
  statusAmber: { background: '#fef3c7', color: '#b45309' },
  solutionNote: {
    background: '#f8fafc',
    padding: '8px 10px',
    borderRadius: '8px',
    fontSize: '0.78rem',
    color: '#334155',
    border: '1px solid #e2e8f0'
  },
  emptyCard: {
    background: '#ffffff',
    padding: '30px',
    textAlign: 'center',
    borderRadius: '14px',
    color: '#94a3b8',
    fontSize: '0.88rem'
  }
};

export default PersonelPaneli;