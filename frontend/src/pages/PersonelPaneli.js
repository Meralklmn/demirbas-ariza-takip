/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  PlusCircle, 
  History, 
  Clock, 
  User, 
  AlertCircle,
  Search,
  X
} from 'lucide-react';

const BASE_URL = 'https://demirbas-ariza-takip.onrender.com';

function PersonelPaneli() {
  const [demirbaslar, setDemirbaslar] = useState([]);
  const [kullaniciArizalari, setKullaniciArizalari] = useState([]);
  const [loading, setLoading] = useState(true);

  const [personelAd, setPersonelAd] = useState('');
  const [personelTc, setPersonelTc] = useState('');

  const [aktifSekme, setAktifSekme] = useState('yeni_ariza');
  const [secilenDemirbasId, setSecilenDemirbasId] = useState('');
  const [aramaMetni, setAramaMetni] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [resim, setResim] = useState(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useEffect(() => {
    const ad = localStorage.getItem('userName') || 'Personel';
    const tc = localStorage.getItem('userTc') || '';
    setPersonelAd(ad);
    setPersonelTc(tc);
  }, []);

  const verileriGetir = useCallback(async () => {
    try {
      const [resDemirbas, resAriza] = await Promise.all([
        axios.get(`${BASE_URL}/api/demirbaslar`),
        axios.get(`${BASE_URL}/api/arizalar`)
      ]);

      const demirbasList = Array.isArray(resDemirbas.data) ? resDemirbas.data : [];
      const arizaList = Array.isArray(resAriza.data) ? resAriza.data : [];

      setDemirbaslar(demirbasList);

      const tc = localStorage.getItem('userTc');
      if (tc) {
        const filtrelenmis = arizaList.filter(a => a.bildiren_tc === tc || a.bildiren_kisi?.includes(localStorage.getItem('userName')));
        setKullaniciArizalari(filtrelenmis);
      } else {
        setKullaniciArizalari(arizaList);
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      toast.error('Veriler sunucudan çekilemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verileriGetir();
  }, [verileriGetir]);

  // Türkçe Karakter Destekli Canlı Arama/Filtreleme Mantığı
  const filtrelenmisDemirbaslar = demirbaslar.filter((d) => {
    if (!aramaMetni.trim()) return true;
    const arama = aramaMetni.toLocaleLowerCase('tr-TR').trim();
    const ad = (d.ad || '').toLocaleLowerCase('tr-TR');
    const birim = (d.birim || '').toLocaleLowerCase('tr-TR');
    const kod = (d.qr_kod || d.id || '').toString().toLocaleLowerCase('tr-TR');

    return ad.includes(arama) || birim.includes(arama) || kod.includes(arama);
  });

  // ARIZA BİLDİRİMİ GÖNDERME
  const handleArizaGonder = async (e) => {
    e.preventDefault();

    if (!secilenDemirbasId) {
      toast.warning('Lütfen arızalı demirbaşı listeden seçin.');
      return;
    }

    if (!aciklama.trim()) {
      toast.warning('Lütfen arıza açıklamasını yazın.');
      return;
    }

    setGonderiliyor(true);

    try {
      const formData = new FormData();
      formData.append('demirbas_id', secilenDemirbasId);
      formData.append('aciklama', aciklama);
      formData.append('bildiren_kisi', personelAd);
      formData.append('bildiren_tc', personelTc);

      if (resim) {
        formData.append('resim', resim);
      }

      await axios.post(`${BASE_URL}/api/arizalar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Arıza kaydı teknik ekibe başarıyla iletildi!');
      setSecilenDemirbasId('');
      setAramaMetni('');
      setAciklama('');
      setResim(null);
      setAktifSekme('gecmis');
      verileriGetir();
    } catch (err) {
      console.error('Arıza kaydı hatası:', err);
      toast.error('Arıza kaydı oluşturulurken bir hata oluştu.');
    } finally {
      setGonderiliyor(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b' }}>
        <Clock size={32} color="#800020" style={{ marginBottom: '10px' }} />
        <div style={{ fontWeight: '600' }}>Personel Paneli Yükleniyor...</div>
      </div>
    );
  }

  const seciliDemirbas = demirbaslar.find(d => d.id.toString() === secilenDemirbasId.toString());

  return (
    <div style={{ width: '100%', boxSizing: 'border-box' }}>
      
      {/* KARŞILAMA KARTI */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={styles.userAvatarIcon}>
            <User size={24} color="#800020" />
          </div>
          <div>
            <h2 style={styles.welcomeTitle}>
              Hoş Geldiniz, {personelAd}
            </h2>
           
          </div>
        </div>
      </div>

      {/* SEKME SEÇİMLERİ */}
      <div style={styles.tabGrid}>
        <button 
          type="button"
          onClick={() => setAktifSekme('yeni_ariza')}
          style={{ ...styles.tabBtn, ...(aktifSekme === 'yeni_ariza' ? styles.activeTabBtn : {}) }}
        >
          <PlusCircle size={15} /> Yeni Arıza Bildir
        </button>

        <button 
          type="button"
          onClick={() => setAktifSekme('gecmis')}
          style={{ ...styles.tabBtn, ...(aktifSekme === 'gecmis' ? styles.activeTabBtn : {}) }}
        >
          <History size={15} /> Bildirdiğim Arıza Kayıtları ({kullaniciArizalari.length})
        </button>
      </div>

      {/* 1. SEKME: YENİ ARIZA BİLDİRİM FORMU */}
      {aktifSekme === 'yeni_ariza' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>
            <AlertCircle size={18} color="#800020" /> Yeni Arıza Bildirimi Oluştur
          </h3>

          <form onSubmit={handleArizaGonder} style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* CANLI ARAMA KUTUSU VE LİSTE */}
            <div>
              <label style={styles.label}>1. ARIZALI DEMİRBAŞI ARA VE SEÇ:</label>
              
              <div style={styles.searchBoxWrapper}>
                <Search size={16} color="#64748b" style={{ marginLeft: '10px' }} />
                <input
                  type="text"
                  placeholder="Demirbaş adı, kod veya birim yazın..."
                  value={aramaMetni}
                  onChange={(e) => setAramaMetni(e.target.value)}
                  style={styles.searchInput}
                />
                {aramaMetni && (
                  <button 
                    type="button" 
                    onClick={() => setAramaMetni('')}
                    style={{ background: 'none', border: 'none', paddingRight: '10px', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Tıklanabilir Süzülen Liste */}
              <div style={styles.listContainer}>
                {filtrelenmisDemirbaslar.length > 0 ? (
                  filtrelenmisDemirbaslar.map((d) => {
                    const seciliMi = secilenDemirbasId.toString() === d.id.toString();
                    return (
                      <div
                        key={d.id}
                        onClick={() => setSecilenDemirbasId(d.id.toString())}
                        style={{
                          ...styles.listItem,
                          backgroundColor: seciliMi ? '#f0fdf4' : '#ffffff',
                          borderLeft: seciliMi ? '4px solid #16a34a' : 'none'
                        }}
                      >
                        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>{d.ad}</div>
                        <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '2px' }}>
                          Kod: {d.qr_kod || d.id} | Birim: {d.birim || 'Genel'}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '12px', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
                    Aramanıza uygun demirbaş bulunamadı.
                  </div>
                )}
              </div>

              {seciliDemirbas && (
                <div style={styles.selectedDeviceCard}>
                  <div style={{ fontWeight: '800', color: '#166534', fontSize: '0.88rem' }}>
                    ✓ Seçilen Cihaz: {seciliDemirbas.ad}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '2px' }}>
                    Kod: {seciliDemirbas.qr_kod || seciliDemirbas.id} | Birim: {seciliDemirbas.birim || 'Genel'}
                  </div>
                </div>
              )}
            </div>

            {/* AÇIKLAMA */}
            <div>
              <label style={styles.label}>2. ARIZA AÇIKLAMASI:</label>
              <textarea
                rows="3"
                placeholder="Cihazda yaşadığınız teknik sorunu detaylıca açıklayınız..."
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                required
                style={styles.textarea}
              />
            </div>

            {/* GÖRSEL YÜKLEME */}
            <div>
              <label style={styles.label}>3. ARIZA GÖRSELİ EKLE (OPSİYONEL):</label>
              <div style={styles.fileInputWrapper}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setResim(e.target.files[0])}
                  style={styles.fileInput}
                />
              </div>
            </div>

            <button type="submit" disabled={gonderiliyor} style={styles.submitBtn}>
              {gonderiliyor ? 'Gönderiliyor...' : 'Arıza Kaydını Teknik Ekibe Gönder'}
            </button>
          </form>
        </div>
      )}

      {/* 2. SEKME: GEÇMİŞ ARIZA KAYITLARI */}
      {aktifSekme === 'gecmis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {kullaniciArizalari.length === 0 ? (
            <div style={styles.emptyCard}>Henüz oluşturduğunuz bir arıza kaydı bulunmuyor.</div>
          ) : (
            kullaniciArizalari.map(a => (
              <div key={a.id} style={styles.itemCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.9rem' }}>
                      {a.demirbas_adi || `Demirbaş #${a.demirbas_id}`}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                      Tarih: {a.tarih ? new Date(a.tarih).toLocaleDateString('tr-TR') : 'Bugün'}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    background: a.durum === 'Çözüldü' ? '#dcfce7' : a.durum === 'İşlemde' ? '#e0f2fe' : '#fef3c7',
                    color: a.durum === 'Çözüldü' ? '#15803d' : a.durum === 'İşlemde' ? '#0369a1' : '#b45309'
                  }}>
                    {a.durum || 'Beklemede'}
                  </span>
                </div>

                <p style={{ margin: '8px 0', fontSize: '0.82rem', color: '#334155' }}>{a.aciklama}</p>

                {a.cozum_notu && (
                  <div style={styles.solutionBox}>
                    <strong>Teknik Ekip Notu:</strong> {a.cozum_notu}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}

const styles = {
  headerCard: {
    background: '#ffffff',
    padding: '14px 16px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  userAvatarIcon: {
    background: '#fdf2f2',
    padding: '10px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  welcomeTitle: {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: '800',
    color: '#0f172a'
  },
  subTitleText: {
    fontSize: '0.72rem',
    color: '#64748b',
    fontWeight: '500',
    marginTop: '2px'
  },
  tabGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    background: '#ffffff',
    padding: '6px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '12px'
  },
  tabBtn: {
    padding: '10px 6px',
    border: 'none',
    background: 'transparent',
    borderRadius: '8px',
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  activeTabBtn: {
    background: '#800020',
    color: '#ffffff'
  },
  card: {
    background: '#ffffff',
    padding: '16px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0'
  },
  cardTitle: {
    margin: 0,
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  label: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '4px',
    textTransform: 'uppercase'
  },
  searchBoxWrapper: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    overflow: 'hidden'
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    outline: 'none',
    fontSize: '0.85rem',
    backgroundColor: 'transparent'
  },
  listContainer: {
    maxHeight: '180px',
    overflowY: 'auto',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    marginTop: '6px',
    background: '#ffffff'
  },
  listItem: {
    padding: '10px 12px',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  selectedDeviceCard: {
    marginTop: '8px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    padding: '10px 12px',
    borderRadius: '8px'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  fileInputWrapper: {
    border: '1px dashed #cbd5e1',
    padding: '10px',
    borderRadius: '8px',
    background: '#f8fafc'
  },
  fileInput: {
    fontSize: '0.8rem',
    width: '100%'
  },
  submitBtn: {
    width: '100%',
    padding: '12px',
    background: '#800020',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    fontSize: '0.88rem',
    cursor: 'pointer',
    marginTop: '6px'
  },
  itemCard: {
    background: '#ffffff',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  solutionBox: {
    marginTop: '8px',
    padding: '8px 10px',
    background: '#f1f5f9',
    borderRadius: '6px',
    fontSize: '0.78rem',
    color: '#1e293b',
    borderLeft: '3px solid #0284c7'
  },
  emptyCard: {
    background: '#ffffff',
    padding: '24px',
    textAlign: 'center',
    borderRadius: '12px',
    color: '#94a3b8',
    fontSize: '0.85rem'
  }
};

export default PersonelPaneli;