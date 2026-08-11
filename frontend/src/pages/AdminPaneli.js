/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'react-toastify';
import { 
  Search, 
  PlusCircle, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  QrCode, 
  ListFilter, 
  Camera, 
  History,
  Download,
  X,
  Trash2,
  UserX,
  User
} from 'lucide-react';

const API_URL = 'https://demirbas-ariza-takip.onrender.com/api';

function AdminPaneli() {
  const [demirbaslar, setDemirbaslar] = useState([]);
  const [arizalar, setArizalar] = useState([]);
  const [loading, setLoading] = useState(true);

  // Giriş yapan yöneticinin adı
  const [yoneticiAdi, setYoneticiAdi] = useState('');

  // AKTİF MOD ('envanter' | 'ekle' | 'sorgula' | 'arizalar')
  const [aktifMod, setAktifMod] = useState('envanter');

  const [yeniDemirbas, setYeniDemirbas] = useState({ 
    qr_kod: '', ad: '', kategori: '', birim: '', konum: '', alim_tarihi: '' 
  });

  const [secimYontemi, setSecimYontemi] = useState('qr');
  const [secilenDemirbasId, setSecilenDemirbasId] = useState('');
  const [kameraAcik, setKameraAcik] = useState(false);
  const [aktifQR, setAktifQR] = useState(null);

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

  // QR KOD OKUYUCU
  useEffect(() => {
    let scanner = null;
    if (aktifMod === 'sorgula' && secimYontemi === 'qr' && kameraAcik) {
      scanner = new Html5QrcodeScanner(
        "admin-qr-reader",
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
              toast.success(`${eslesen.ad} bulundu.`);
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

  // YENİ DEMİRBAŞ EKLEME
  const handleDemirbasEkle = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/demirbaslar`, yeniDemirbas);
      toast.success(`${yeniDemirbas.ad} envantere eklendi!`);
      setYeniDemirbas({ qr_kod: '', ad: '', kategori: '', birim: '', konum: '', alim_tarihi: '' });
      
      if (res.data && res.data.qrDataUrl) {
        setAktifQR({
          ad: res.data.ad,
          qr_kod: res.data.qr_kod,
          qrDataUrl: res.data.qrDataUrl
        });
      }

      verileriGetir();
    } catch (err) {
      console.error('Ekleme hatası:', err);
      toast.error('Demirbaş eklenirken bir hata oluştu.');
    }
  };

  // QR KOD ÇEKME
  const handleQRGoster = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/demirbaslar/${id}/qr`);
      if (res.data) {
        setAktifQR(res.data);
      }
    } catch (err) {
      console.error('QR getirilemedi:', err);
      toast.error('QR Kod yüklenemedi.');
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

  // HESAP SİLME FONKSİYONU
  const handleHesapSil = async () => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      alert('Oturum ID bilginiz bulunamadı. Lütfen bir kez çıkış yapıp tekrar giriş yapın.');
      return;
    }

    const onay = window.confirm('Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.');
    if (!onay) return;

    try {
      await axios.delete(`${API_URL}/kullanicilar/${userId}`);
      toast.success('Hesabınız başarıyla silindi.');
      localStorage.clear();
      window.location.href = '/login';
    } catch (err) {
      console.error('Hesap silme hatası:', err);
      toast.error('Hesap silinirken sunucu hatası oluştu.');
    }
  };

  // MOBİL UYUMLU QR İNDİRME
  const handleQRDownload = () => {
    if (!aktifQR || !aktifQR.qrDataUrl) return;

    const newWin = window.open('', '_blank');
    if (newWin) {
      newWin.document.write(`
        <html>
          <head>
            <title>${aktifQR.ad} - QR Kod</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; margin:0; background:#f8fafc; font-family:sans-serif; text-align:center; padding:20px;">
            <h3 style="color:#0f172a; margin-bottom:6px;">${aktifQR.ad}</h3>
            <p style="color:#64748b; font-size:13px; margin-bottom:16px;">Görsele basılı tutarak telefonunuza kaydedebilirsiniz.</p>
            <img src="${aktifQR.qrDataUrl}" alt="${aktifQR.ad} QR" style="max-width:85%; height:auto; border:1px solid #cbd5e1; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);" />
          </body>
        </html>
      `);
    } else {
      const link = document.createElement('a');
      link.href = aktifQR.qrDataUrl;
      link.download = `QR_${aktifQR.qr_kod}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
      
      {/* HOŞ GELDİNİZ [AD SOYAD] KARTI */}
      <div style={styles.headerCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={styles.userAvatarIcon}>
            <User size={24} color="#800020" />
          </div>
          <div>
            <h2 style={styles.welcomeTitle}>
              Hoş Geldiniz, {yoneticiAdi}
            </h2>
            <div style={styles.subTitleText}>
              Trabzon Ortahisar Belediyesi • Yönetim Portalı
            </div>
          </div>
        </div>

        {/* HESABIMI SİL BUTONU */}
        <button onClick={handleHesapSil} style={styles.deleteAccountBtn}>
          <UserX size={14} /> Hesabımı Sil
        </button>
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
          <Package size={15} /> Envanter ({demirbaslar.length})
        </button>

        <button 
          onClick={() => setAktifMod('ekle')}
          style={{ ...styles.tabBtn, ...(aktifMod === 'ekle' ? styles.activeTabBtn : {}) }}
        >
          <PlusCircle size={15} /> Yeni Ekle
        </button>

        <button 
          onClick={() => setAktifMod('sorgula')}
          style={{ ...styles.tabBtn, ...(aktifMod === 'sorgula' ? styles.activeTabBtn : {}) }}
        >
          <Search size={15} /> Sorgula
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
          {demirbaslar.length === 0 ? (
            <div style={styles.emptyCard}>Envanterde kayıtlı demirbaş bulunamadı.</div>
          ) : (
            demirbaslar.map(d => {
              const arizaSayisi = arizalar.filter(a => a.demirbas_id?.toString() === d.id.toString()).length;
              return (
                <div key={d.id} style={styles.itemCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.92rem' }}>{d.ad}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        QR: <strong>{d.qr_kod}</strong> | Birim: {d.birim || 'Genel'}
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
                    <button onClick={() => handleQRGoster(d.id)} style={styles.btnQrMobile}>
                      <QrCode size={13} /> QR İndir
                    </button>
                    <button onClick={() => handleDemirbasSil(d.id, d.ad)} style={styles.btnDeleteMobile}>
                      <Trash2 size={13} /> Sil
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
              <label style={styles.label}>QR / Barkod Kodu</label>
              <input 
                placeholder="Örn: D-101" 
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
              <PlusCircle size={16} /> Demirbaşı Kaydet ve QR Üret
            </button>
          </form>
        </div>
      )}

      {/* 3. MOD: SORGULA */}
      {aktifMod === 'sorgula' && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Demirbaş Sorgula</h3>
          
          <div style={styles.subTabGrid}>
            <button
              type="button"
              onClick={() => handleYontemChange('qr')}
              style={{ ...styles.subTabBtn, ...(secimYontemi === 'qr' ? styles.activeSubTab : {}) }}
            >
              <QrCode size={14} /> QR Okut
            </button>
            <button
              type="button"
              onClick={() => handleYontemChange('manual')}
              style={{ ...styles.subTabBtn, ...(secimYontemi === 'manual' ? styles.activeSubTab : {}) }}
            >
              <ListFilter size={14} /> Listeden Seç
            </button>
          </div>

          {secimYontemi === 'qr' && (
            <div style={{ marginTop: '12px' }}>
              <button 
                type="button" 
                onClick={() => setKameraAcik(!kameraAcik)}
                style={{ ...styles.cameraBtn, background: kameraAcik ? '#ef4444' : '#0f172a' }}
              >
                <Camera size={16} /> {kameraAcik ? 'Kamerayı Kapat' : 'Cihaz QR Kodunu Okut'}
              </button>

              {kameraAcik && (
                <div style={{ marginTop: '10px', background: '#ffffff', padding: '8px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <div id="admin-qr-reader" style={{ width: '100%' }}></div>
                </div>
              )}
            </div>
          )}

          {secimYontemi === 'manual' && (
            <div style={{ marginTop: '12px' }}>
              <select 
                value={secilenDemirbasId} 
                onChange={(e) => setSecilenDemirbasId(e.target.value)} 
                style={styles.mobileSelect}
              >
                <option value="">-- Cihaz Seçin --</option>
                {demirbaslar.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.ad} (QR: {d.qr_kod})
                  </option>
                ))}
              </select>
            </div>
          )}

          {seciliDemirbas && (
            <div style={styles.resultCard}>
              <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '0.95rem' }}>{seciliDemirbas.ad}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>QR: {seciliDemirbas.qr_kod} | Birim: {seciliDemirbas.birim || 'Genel'}</div>
              <div style={{ marginTop: '10px', fontSize: '0.8rem', fontWeight: '700', color: '#334155' }}>
                Toplam Arıza Kaydı: {seciliCihazGecmisi.length}
              </div>
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

      {/* POPUP QR MODAL */}
      {aktifQR && (
        <div style={styles.overlay}>
          <div style={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#0f172a' }}>📱 Demirbaş QR Kodu</span>
              <button onClick={() => setAktifQR(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img src={aktifQR.qrDataUrl} alt="QR Kod" style={{ width: '160px', height: '160px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              <div style={{ marginTop: '8px', fontWeight: '700', fontSize: '0.88rem', color: '#0f172a' }}>{aktifQR.ad}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '12px' }}>Kod: {aktifQR.qr_kod}</div>
              
              <button onClick={handleQRDownload} style={{ ...styles.downloadBtn, border: 'none', width: '100%', justifyContent: 'center', cursor: 'pointer' }}>
                <Download size={14} /> İndir / Kaydet
              </button>
            </div>
          </div>
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
  deleteAccountBtn: {
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '7px 11px',
    borderRadius: '8px',
    fontSize: '0.72rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
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
  actionRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '8px'
  },
  btnQrMobile: {
    flex: 1,
    padding: '8px',
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#334155',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px'
  },
  btnDeleteMobile: {
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
  mobileInput: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' },
  mobileSelect: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', outline: 'none' },
  submitBtn: { width: '100%', padding: '12px', background: '#800020', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' },
  subTabGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '8px', marginTop: '8px' },
  subTabBtn: { padding: '8px', border: 'none', background: 'transparent', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' },
  activeSubTab: { background: '#ffffff', color: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  cameraBtn: { width: '100%', padding: '10px', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  resultCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', marginTop: '10px' },
  emptyCard: { background: '#ffffff', padding: '24px', textAlign: 'center', borderRadius: '12px', color: '#94a3b8', fontSize: '0.85rem' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px' },
  modalContent: { background: '#ffffff', padding: '20px', borderRadius: '16px', width: '100%', maxWidth: '300px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  downloadBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#16a34a', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: '700', fontSize: '0.8rem' }
};

export default AdminPaneli;