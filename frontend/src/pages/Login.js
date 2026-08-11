/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { LogIn, UserPlus } from 'lucide-react';

const BASE_URL = 'https://demirbas-ariza-takip.onrender.com';

function GirisSayfasi({ onLogin }) {
  const [mod, setMod] = useState('login');
  const [tcNo, setTcNo] = useState('');
  const [adSoyad, setAdSoyad] = useState('');
  const [rol, setRol] = useState('personel');
  const [yukleniyor, setYukleniyor] = useState(false);

  // GİRİŞ İŞLEMİ
  const handleGiris = async (e) => {
    e.preventDefault();

    if (!tcNo || tcNo.trim().length !== 11 || isNaN(tcNo)) {
      toast.warning('Lütfen geçerli ve 11 haneli T.C. Kimlik Numarası giriniz.');
      return;
    }

    setYukleniyor(true);

    try {
      const res = await axios.post(`${BASE_URL}/api/login`, { tc_no: tcNo });
      const { user } = res.data;

      // KULLANICI BİLGİLERİ LOCALSTORAGE'A KAYDEDİLİYOR
      localStorage.setItem('userId', user.id); // <-- HESAP SİLME İÇİN GEREKLİ OLAN ID BURADA KAYDEDİLİYOR
      localStorage.setItem('userName', user.ad_soyad);
      localStorage.setItem('userTc', user.tc_no);
      localStorage.setItem('userRole', user.rol);

      toast.success(`Giriş Başarılı! Hoş geldiniz, Sayın ${user.ad_soyad}.`);

      if (onLogin) {
        onLogin(user);
      }
    } catch (err) {
      console.error('Giriş hatası detayı:', err);
      if (err.response) {
        toast.error(err.response.data?.message || err.response.data?.error || 'Giriş başarısız.');
      } else {
        toast.error('Backend sunucusuna bağlanılamadı.');
      }
    } finally {
      setYukleniyor(false);
    }
  };

  // KAYIT İŞLEMİ
  const handleKayit = async (e) => {
    e.preventDefault();

    if (tcNo.length !== 11 || isNaN(tcNo)) {
      toast.warning('Lütfen geçerli bir 11 haneli T.C. Kimlik Numarası giriniz.');
      return;
    }

    if (!adSoyad.trim()) {
      toast.warning('Lütfen Ad ve Soyad alanını doldurunuz.');
      return;
    }

    setYukleniyor(true);

    try {
      await axios.post(`${BASE_URL}/api/register`, {
        tc_no: tcNo,
        ad_soyad: adSoyad,
        rol: rol
      });

      toast.success(`Kayıt Başarılı! Sayın ${adSoyad}, kaydınız tamamlandı. Şimdi giriş yapabilirsiniz.`);
      setMod('login');
    } catch (err) {
      console.error('Kayıt hatası detayı:', err);
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Bir hata oluştu.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* LOGO VE BAŞLIK */}
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <img 
            src="/trabzon-ortahisar-belediyesi-logo-png_seeklogo-386190.png" 
            alt="Logo" 
            style={{ height: '40px', width: 'auto', marginBottom: '6px' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h2 style={styles.title}>TRABZON ORTAHİSAR BELEDİYESİ</h2>
          <span style={styles.subtitle}>Demirbaş & Arıza Takip Sistemi</span>
        </div>

        {/* MOD SEKMELERİ */}
        <div style={styles.tabGrid}>
          <button
            type="button"
            onClick={() => { setMod('login'); setTcNo(''); setAdSoyad(''); }}
            style={{
              ...styles.tabBtn,
              ...(mod === 'login' ? styles.activeTabBtn : {})
            }}
          >
            <LogIn size={14} /> Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => { setMod('register'); setTcNo(''); setAdSoyad(''); }}
            style={{
              ...styles.tabBtn,
              ...(mod === 'register' ? styles.activeTabBtn : {})
            }}
          >
            <UserPlus size={14} /> Yeni Kayıt
          </button>
        </div>

        {/* GİRİŞ FORMU */}
        {mod === 'login' && (
          <form onSubmit={handleGiris} style={styles.form}>
            <div>
              <label style={styles.label}>T.C. Kimlik Numarası:</label>
              <input 
                type="text" 
                maxLength="11"
                inputMode="numeric"
                placeholder="11 haneli T.C. Kimlik No" 
                value={tcNo}
                onChange={(e) => setTcNo(e.target.value.replace(/\D/g, ''))}
                required
                style={styles.input}
              />
            </div>

            <button type="submit" disabled={yukleniyor} style={styles.submitBtn}>
              {yukleniyor ? 'Kontrol Ediliyor...' : 'Sisteme Giriş Yap'}
            </button>
          </form>
        )}

        {/* KAYIT FORMU */}
        {mod === 'register' && (
          <form onSubmit={handleKayit} style={styles.form}>
            <div>
              <label style={styles.label}>T.C. Kimlik Numarası:</label>
              <input 
                type="text" 
                maxLength="11"
                inputMode="numeric"
                placeholder="11 haneli T.C. Kimlik No" 
                value={tcNo}
                onChange={(e) => setTcNo(e.target.value.replace(/\D/g, ''))}
                required
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Adınız ve Soyadınız:</label>
              <input 
                type="text" 
                placeholder="Örn: Ahmet Yılmaz" 
                value={adSoyad}
                onChange={(e) => setAdSoyad(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>Birim / Hesap Türü:</label>
              <select 
                value={rol} 
                onChange={(e) => setRol(e.target.value)}
                style={styles.select}
              >
                <option value="personel">Belediye Personeli (Arıza Bildiren)</option>
                <option value="admin">Teknik Birim & Yönetici</option>
              </select>
            </div>

            <button type="submit" disabled={yukleniyor} style={{ ...styles.submitBtn, background: '#0284c7' }}>
              {yukleniyor ? 'Kaydediliyor...' : 'Sisteme Kayıt Ol'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 120px)',
    padding: '12px',
    boxSizing: 'border-box'
  },
  card: {
    width: '100%',
    maxWidth: '340px',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '18px 14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    boxSizing: 'border-box'
  },
  title: {
    margin: '0 0 2px 0',
    fontSize: '0.92rem',
    fontWeight: '800',
    color: '#800020'
  },
  subtitle: {
    fontSize: '0.72rem',
    color: '#64748b',
    fontWeight: '600'
  },
  tabGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    background: '#f1f5f9',
    padding: '4px',
    borderRadius: '8px',
    margin: '14px 0'
  },
  tabBtn: {
    padding: '8px',
    border: 'none',
    background: 'transparent',
    borderRadius: '6px',
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
    background: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  label: {
    display: 'block',
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#475569',
    marginBottom: '3px',
    textTransform: 'uppercase'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#f8fafc'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.82rem',
    outline: 'none',
    backgroundColor: '#f8fafc'
  },
  submitBtn: {
    width: '100%',
    padding: '11px',
    background: '#800020',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
    marginTop: '4px'
  }
};

export default GirisSayfasi;