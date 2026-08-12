/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Search, 
  PlusCircle, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  History,
  Trash2,
  User,
  X,
  FileText
} from 'lucide-react';

const API_URL = 'https://demirbas-ariza-takip.onrender.com/api';

function AdminPaneli() {
  const [demirbaslar, setDemirbaslar] = useState([]);
  const [arizalar, setArizalar] = useState([]);
  const [loading, setLoading] = useState(true);

  const [yoneticiAdi, setYoneticiAdi] = useState('');

  // AKTİF MOD ('envanter' | 'ekle' | 'sorgula' | 'arizalar')
  const [aktifMod, setAktifMod] = useState('envanter');

  const [yeniDemirbas, setYeniDemirbas] = useState({ 
    qr_kod: '', ad: '', kategori: '', birim: '', konum: '', alim_tarihi: '' 
  });

  const [secilenDemirbasId, setSecilenDemirbasId] = useState('');
  const [aramaMetni, setAramaMetni] = useState('');

  useEffect(() => {
    const kayitliAd = localStorage.getItem('userName') || 'Yönetici';
    setYoneticiAdi(kayitliAd);
  }, []);

  // Verileri Getir
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
      toast.error('Veriler yüklenirken sunucu hatası oluştu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verileriGetir();
  }, [verileriGetir]);

  // Türkçe Karakter Uyumlu Anlık Arama
  const filtrelenmisDemirbaslar = demirbaslar.filter((d) => {
    if (!aramaMetni.trim()) return true;
    const arama = aramaMetni.toLocaleLowerCase('tr-TR').trim();
    const ad = (d.ad || '').toLocaleLowerCase('tr-TR');
    const birim = (d.birim || '').toLocaleLowerCase('tr-TR');
    const kod = (d.qr_kod || d.id || '').toString().toLocaleLowerCase('tr-TR');

    return ad.includes(arama) || birim.includes(arama) || kod.includes(arama);
  });

  // YENİ DEMİRBAŞ EKLEME
  const handleDemirbasEkle = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/demirbaslar`, {
        qr_kod: yeniDemirbas.qr_kod,
        ad: yeniDemirbas.ad,
        kategori: yeniDemirbas.kategori,
        birim: yeniDemirbas.birim,
        konum: yeniDemirbas.konum,
        alim_tarihi: yeniDemirbas.alim_tarihi
      });

      toast.success(`${yeniDemirbas.ad} envantere eklendi!`);
      setYeniDemirbas({ qr_kod: '', ad: '', kategori: '', birim: '', konum: '', alim_tarihi: '' });
      setAktifMod('envanter');
      verileriGetir();
    } catch (err) {
      console.error('Ekleme hatası:', err);
      toast.error('Demirbaş eklenirken bir hata oluştu.');
    }
  };

  // SİLME
  const handleDemirbasSil = async (id, ad) => {
    const onay = window.confirm(`"${ad}" isimli demirbaşı ve bağlı tüm arıza geçmişini silmek istediğinize emin misiniz?`);
    if (!onay) return;

    try {
      await axios.delete(`${API_URL}/demirbaslar/${id}`);
      toast.success('Demirbaş envanterden silindi.');

      if (secilenDemirbasId.toString() === id.toString()) {
        setSecilenDemirbasId('');
      }

      verileriGetir();
    } catch (err) {
      console.error('Silme hatası:', err);
      toast.error('Demirbaş silinirken hata oluştu.');
    }
  };

  const handleDurumGuncelle = async (id, durum) => {
    const cozum_notu = prompt('Çözüm / İşlem Notu Giriniz:');
    if (cozum_notu === null) return;

    try {
      await axios.put(`${API_URL}/arizalar/${id}`, { durum, cozum_notu });
      toast.success(`Durum "${durum}" olarak güncellendi.`);
      verileriGetir();
    } catch (err) {
      console.error('Güncelleme hatası:', err);
      toast.error('Güncelleme yapılamadı.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: '#64748b' }}>
        <Clock size={32} color="#0284c7" style={{ marginBottom: '10px' }} />
        <div style={{ fontWeight: '600' }}>Yönetici Paneli Yükleniyor...</div>
      </div>
    );
  }

  const bekleyenSayisi = arizalar.filter(a => !a.durum || a.durum === 'Beklemede' || a.durum === 'Açık').length;
  const islemdeSayisi = arizalar.filter(a => a.durum === 'İşlemde').length;
  const cozulenSayisi = arizalar.filter(a => a.durum === 'Çözüldü').length;

  const seciliDemirbas = demirbaslar.find(d => d.id.toString() === secilenDemirbasId.toString());
  const seciliCihazGecmisi = arizalar.filter(a => a.demirbas_id?.toString() === secilenDemirbasId.toString());

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
              Hoş Geldiniz, {yoneticiAdi}
            </h2>
          </div>
        </div>
      </div>

      {/* İSTATİSTİK GRID */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <Clock size={18} color="#d97706" />
          <div>
            <div style={styles.statValue}>{bekleyenSayisi}</div>
            <span style={styles.statLabel}>Bekleyen</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <AlertTriangle size={18} color="#0284c7" />
          <div>
            <div style={styles.statValue}>{islemdeSayisi}</div>
            <span style={styles.statLabel}>İşlemde</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <CheckCircle2 size={18} color="#16a34a" />
          <div>
            <div style={styles.statValue}>{cozulenSayisi}</div>
            <span style={styles.statLabel}>Çözüldü</span>
          </div>
        </div>

        <div style={styles.statCard}>
          <Package size={18} color="#9333ea" />
          <div>
            <div style={styles.statValue}>{demirbaslar.length}</div>
            <span style={styles.statLabel}>Demirbaş</span>
          </div>
        </div>
      </div>

      {/* SEKME SEÇİMLERİ */}
      <div style={styles.tabGrid}>
        <button 
          onClick={() => setAktifMod('envanter')}
          style={{ ...styles.tabBtn, ...(aktifMod === 'envanter' ? styles.activeTabBtn : {}) }}
        >
          <Package size={15} /> Demirbaşlar ({demirbaslar.length})
        </button>

        <button 
          onClick={() => setAktifMod('ekle')}
          style={{ ...styles.tabBtn, ...(aktifMod === 'ekle' ? styles.activeTabBtn : {}) }}
        >
          <PlusCircle size={15} /> Yeni Demirbaş Ekle
        </button>

        <button 
          onClick={() => setAktifMod('sorgula')}
          style={{ ...styles.tabBtn, ...(aktifMod === 'sorgula' ? styles.activeTabBtn : {}) }}
        >
          <Search size={15} /> Arıza Sorgula
        </button>

        <button 
          onClick={() => setAktifMod('arizalar')}
          style={{ ...styles.tabBtn, ...(aktifMod === 'arizalar' ? styles.activeTabBtn : {}) }}
        >
          <History size={15} /> Arızalar ({arizalar.length})
        </button>
      </div>

      {/* 1. MOD: ENVANTER */}
      {aktifMod === 'envanter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Arama Kutusu */}
          <div style={styles.searchBoxWrapper}>
            <Search size={16} color="#64748b" style={{ marginLeft: '10px' }} />
            <input
              type="text"
              placeholder="Envanterde demirbaş adı, kod veya birim ara..."
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

          {filtrelenmisDemirbaslar.length === 0 ? (
            <div style={styles.emptyCard}>Aramanıza uygun demirbaş bulunamadı.</div>
          ) : (
            filtrelenmisDemirbaslar.map(d => {
              const arizaSayisi = arizalar.filter(a => a.demirbas_id?.toString() === d.id.toString()).length;
              return (
                <div key={d.id} style={styles.itemCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.92rem' }}>{d.ad}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        Demirbaş Kodu: <strong>{d.qr_kod || d.id}</strong> | Birim: {d.birim || 'Genel'}
                      </div>
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      background: arizaSayisi > 2 ? '#fef2f2' : arizaSayisi > 0 ? '#fef3c7' : '#f1f5f9',
                      color: arizaSayisi > 2 ? '#dc2626' : arizaSayisi > 0 ? '#b45309' : '#475569'
                    }}>
                      {arizaSayisi} Arıza
                    </span>
                  </div>

                  <div style={styles.actionRow}>
                    <button onClick={() => handleDemirbasSil(d.id, d.ad)} style={styles.btnDeleteMobile}>
                      <Trash2 size={13} /> Envanterden Sil
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. MOD: YENİ EKLE */}
      {aktifMod === 'ekle' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Yeni Demirbaş Ekle</h3>
          <form onSubmit={handleDemirbasEkle} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
            <div>
              <label style={styles.label}>Demirbaş Kodu / Seri No</label>
              <input 
                placeholder="Örn: DMR-101" 
                value={yeniDemirbas.qr_kod} 
                onChange={e => setYeniDemirbas({...yeniDemirbas, qr_kod: e.target.value})} 
                required 
                style={styles.mobileInput} 
              />
            </div>

            <div>
              <label style={styles.label}>Demirbaş Adı</label>
              <input 
                placeholder="Örn: Lenovo ThinkPad Dizüstü Bilgisayar" 
                value={yeniDemirbas.ad} 
                onChange={e => setYeniDemirbas({...yeniDemirbas, ad: e.target.value})} 
                required 
                style={styles.mobileInput} 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={styles.label}>Kategori</label>
                <input 
                  placeholder="Örn: Donanım" 
                  value={yeniDemirbas.kategori} 
                  onChange={e => setYeniDemirbas({...yeniDemirbas, kategori: e.target.value})} 
                  style={styles.mobileInput} 
                />
              </div>
              <div>
                <label style={styles.label}>Birim</label>
                <input 
                  placeholder="Örn: Bilgi İşlem" 
                  value={yeniDemirbas.birim} 
                  onChange={e => setYeniDemirbas({...yeniDemirbas, birim: e.target.value})} 
                  style={styles.mobileInput} 
                />
              </div>
            </div>

            <button type="submit" style={styles.submitBtn}>
              <PlusCircle size={16} /> Demirbaşı Kaydet
            </button>
          </form>
        </div>
      )}

      {/* 3. MOD: SORGULA */}
      {aktifMod === 'sorgula' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Demirbaş Sorgula</h3>
          
          <div style={{ marginTop: '12px' }}>
            <label style={styles.label}>DEMİRBAŞ ARA VE SEÇ:</label>
            
            {/* Arama Kutusu */}
            <div style={styles.searchBoxWrapper}>
              <Search size={16} color="#64748b" style={{ marginLeft: '10px' }} />
              <input
                type="text"
                placeholder="Cihaz adı, kod veya birim yazın..."
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
                        backgroundColor: seciliMi ? '#e0f2fe' : '#ffffff',
                        borderLeft: seciliMi ? '4px solid #0284c7' : 'none'
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
          </div>

          {seciliDemirbas && (
            <div style={styles.resultCard}>
              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>{seciliDemirbas.ad}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Kod: {seciliDemirbas.qr_kod || seciliDemirbas.id} | Birim: {seciliDemirbas.birim || 'Genel'}</div>
              <div style={{ marginTop: '10px', fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>
                Toplam Arıza Kaydı: {seciliCihazGecmisi.length}
              </div>

              {/* SORGULANAN CİHAZIN ARIZA GEÇMİŞİ VE TEKNİK BİRİM NOTLARI */}
              {seciliCihazGecmisi.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {seciliCihazGecmisi.map(ag => (
                    <div key={ag.id} style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700' }}>
                        <span>Bildiren: {ag.bildiren_kisi || 'Bilinmiyor'}</span>
                        <span style={{ color: ag.durum === 'Çözüldü' ? '#16a34a' : ag.durum === 'İşlemde' ? '#0284c7' : '#b45309' }}>
                          {ag.durum || 'Beklemede'}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#334155' }}>{ag.aciklama}</p>
                      
                      {/* ÇÖZÜM / TEKNİK BİRİM NOTU */}
                      {ag.cozum_notu && (
                        <div style={styles.cozumNotuKutusu}>
                          <div style={{ fontWeight: '800', color: '#0369a1', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FileText size={12} /> Teknik Birim Notu:
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#0f172a', marginTop: '2px' }}>{ag.cozum_notu}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. MOD: ARIZALAR */}
      {aktifMod === 'arizalar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {arizalar.length === 0 ? (
            <div style={styles.emptyCard}>Bildirilen aktif arıza kaydı yok.</div>
          ) : (
            arizalar.map(a => (
              <div key={a.id} style={styles.itemCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.9rem' }}>
                      {a.demirbas_adi || `Demirbaş #${a.demirbas_id}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Bildiren: {a.bildiren_kisi || 'Bilinmiyor'}
                    </div>
                  </div>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    background: a.durum === 'Çözüldü' ? '#dcfce7' : a.durum === 'İşlemde' ? '#e0f2fe' : '#fef3c7',
                    color: a.durum === 'Çözüldü' ? '#15803d' : a.durum === 'İşlemde' ? '#0369a1' : '#b45309'
                  }}>
                    {a.durum || 'Beklemede'}
                  </span>
                </div>

                <p style={{ margin: '8px 0', fontSize: '0.82rem', color: '#334155' }}>{a.aciklama}</p>

                {/* EKLENEN KISIM: TEKNİK BİRİM / ÇÖZÜM NOTU GÖSTERİMİ */}
                {a.cozum_notu && (
                  <div style={styles.cozumNotuKutusu}>
                    <div style={{ fontWeight: '800', color: '#0369a1', fontSize: '0.73rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FileText size={13} /> Teknik Birim Notu:
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#0f172a', marginTop: '2px', fontWeight: '500' }}>
                      {a.cozum_notu}
                    </div>
                    {a.cozum_tarihi && (
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '4px' }}>
                        İşlem Tarihi: {new Date(a.cozum_tarihi).toLocaleString('tr-TR')}
                      </div>
                    )}
                  </div>
                )}

                <div style={styles.actionRow}>
                  <button onClick={() => handleDurumGuncelle(a.id, 'İşlemde')} style={styles.btnProcessMobile}>
                    İşleme Al
                  </button>
                  <button onClick={() => handleDurumGuncelle(a.id, 'Çözüldü')} style={styles.btnSolveMobile}>
                    Çözüldü
                  </button>
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginBottom: '12px'
  },
  statCard: {
    background: '#ffffff',
    padding: '10px 12px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statValue: { fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: '0.68rem', color: '#64748b', fontWeight: '600' },
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
  itemCard: {
    background: '#ffffff',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  cozumNotuKutusu: {
    background: '#f0f9ff',
    borderLeft: '3px solid #0284c7',
    padding: '8px 10px',
    borderRadius: '6px',
    marginTop: '8px',
    marginBottom: '4px'
  },
  actionRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '8px'
  },
  btnDeleteMobile: {
    width: '100%',
    padding: '8px 12px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#dc2626',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  btnProcessMobile: {
    flex: 1,
    padding: '8px',
    background: '#e0f2fe',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#0369a1',
    cursor: 'pointer'
  },
  btnSolveMobile: {
    flex: 1,
    padding: '8px',
    background: '#dcfce7',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#15803d',
    cursor: 'pointer'
  },
  card: {
    background: '#ffffff',
    padding: '16px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0'
  },
  cardTitle: { margin: 0, fontSize: '0.95rem', fontWeight: '800', color: '#0f172a' },
  label: { display: 'block', fontSize: '0.72rem', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase' },
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
  mobileInput: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  submitBtn: { width: '100%', padding: '12px', background: '#800020', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' },
  resultCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', marginTop: '10px' },
  emptyCard: { background: '#ffffff', padding: '24px', textAlign: 'center', borderRadius: '12px', color: '#94a3b8', fontSize: '0.85rem' }
};

export default AdminPaneli;