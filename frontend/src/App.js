/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

import Login from './pages/Login';
import PersonelPaneli from './pages/PersonelPaneli';
import AdminPaneli from './pages/AdminPaneli';
import DemirbasDetay from './pages/DemirbasDetay';
import { Menu, X, LogOut, UserCheck, Shield, UserX } from 'lucide-react';

const API_URL = 'https://demirbas-ariza-takip.onrender.com/api';

function AppRoutes({ role, setRole }) {
  const navigate = useNavigate();

  const handleLoginSuccess = (user) => {
    setRole(user.rol);
    if (user.rol === 'admin') {
      navigate('/admin');
    } else {
      navigate('/personel');
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLoginSuccess} />} />
      <Route path="/personel" element={role === 'personel' || role === 'admin' ? <PersonelPaneli /> : <Navigate to="/login" />} />
      <Route path="/admin" element={role === 'admin' ? <AdminPaneli /> : <Navigate to="/login" />} />
      <Route path="/demirbas/:id" element={<DemirbasDetay />} />
      <Route path="*" element={<Navigate to={role ? (role === 'admin' ? '/admin' : '/personel') : '/login'} />} />
    </Routes>
  );
}

function App() {
  const [role, setRole] = useState(localStorage.getItem('userRole') || null);
  const [sidebarAcik, setSidebarAcik] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setSidebarAcik(false);
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
      handleLogout();
    } catch (err) {
      console.error('Hesap silme hatası:', err);
      toast.error('Hesap silinirken sunucu hatası oluştu.');
    }
  };

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        
        {/* ÜST BAR */}
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {role && (
              <button 
                onClick={() => setSidebarAcik(!sidebarAcik)} 
                style={styles.menuBtn}
              >
                {sidebarAcik ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
            <div>
              <h1 style={styles.headerTitle}>TRABZON ORTAHİSAR BELEDİYESİ</h1>
              <span style={styles.headerSub}>Demirbaş & Arıza Takip</span>
            </div>
          </div>
        </header>

        {/* SOL MENÜ (DRAWER) */}
        {role && (
          <>
            {sidebarAcik && (
              <div 
                onClick={() => setSidebarAcik(false)} 
                style={styles.backdrop}
              />
            )}

            <div style={{
              ...styles.sidebar,
              transform: sidebarAcik ? 'translateX(0)' : 'translateX(-100%)'
            }}>
              <div style={styles.sidebarHeader}>
                <span style={{ fontWeight: '800', color: '#800020', fontSize: '1rem' }}>Sistem Menüsü</span>
                <button onClick={() => setSidebarAcik(false)} style={styles.closeBtn}>
                  <X size={20} />
                </button>
              </div>

              <div style={styles.sidebarNav}>
                {role === 'admin' ? (
                  <Link 
                    to="/admin" 
                    onClick={() => setSidebarAcik(false)} 
                    style={styles.sidebarLink}
                  >
                    <Shield size={18} /> Yönetim Paneli
                  </Link>
                ) : (
                  <Link 
                    to="/personel" 
                    onClick={() => setSidebarAcik(false)} 
                    style={styles.sidebarLink}
                  >
                    <UserCheck size={18} /> Personel Paneli
                  </Link>
                )}

                {/* ÇIKIŞ YAP BUTONU */}
                <button onClick={handleLogout} style={styles.logoutBtn}>
                  <LogOut size={18} />
                  <span>Çıkış Yap</span>
                </button>

                {/* HESABIMI SİL BUTONU (ÇIKIŞ YAP İLE BİREBİR AYNI STİLDE) */}
                <button onClick={handleHesapSil} style={styles.deleteAccountBtn}>
                  <UserX size={18} />
                  <span>Hesabımı Sil</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* İÇERİK ALANI */}
        <main style={{ flex: 1, padding: '16px', boxSizing: 'border-box', maxWidth: '600px', width: '100%', margin: '0 auto' }}>
          <AppRoutes role={role} setRole={setRole} />
        </main>

        <ToastContainer 
          position="bottom-center"
          autoClose={2500}
          hideProgressBar={false}
          theme="colored"
        />
      </div>
    </Router>
  );
}

const styles = {
  header: {
    background: '#800020',
    color: '#ffffff',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center'
  },
  headerTitle: {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: '800',
    letterSpacing: '0.02em'
  },
  headerSub: {
    fontSize: '0.7rem',
    opacity: 0.85,
    display: 'block'
  },
  backdrop: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 200
  },
  sidebar: {
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
    width: '250px',
    backgroundColor: '#ffffff',
    zIndex: 201,
    boxShadow: '4px 0 15px rgba(0,0,0,0.1)',
    transition: 'transform 0.25s ease-in-out',
    display: 'flex',
    flexDirection: 'column'
  },
  sidebarHeader: {
    padding: '16px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer'
  },
  sidebarNav: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  sidebarLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '0.88rem',
    border: '1px solid #e2e8f0'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '8px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    fontWeight: '700',
    fontSize: '0.88rem',
    cursor: 'pointer',
    marginTop: '16px'
  },
  deleteAccountBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 14px',
    borderRadius: '8px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    fontWeight: '700',
    fontSize: '0.88rem',
    cursor: 'pointer'
  }
};

export default App;