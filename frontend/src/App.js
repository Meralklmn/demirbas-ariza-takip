import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login'; // <--- BURASI: GirisSayfasi yerine Login yapıyoruz
import PersonelPaneli from './pages/PersonelPaneli';
import AdminPaneli from './pages/AdminPaneli';
import DemirbasDetay from './pages/DemirbasDetay';

// İç Yönlendirme Bileşeni
function AppRoutes({ role, setRole }) {
  const navigate = useNavigate();

  const handleLoginSuccess = (user) => {
    setRole(user.rol);
    
    // Yönlendirme
    if (user.rol === 'admin') {
      navigate('/admin');
    } else {
      navigate('/personel');
    }
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={<Login onLogin={handleLoginSuccess} />} 
      />
      <Route 
        path="/personel" 
        element={role === 'personel' || role === 'admin' ? <PersonelPaneli /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/admin" 
        element={role === 'admin' ? <AdminPaneli /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/demirbas/:id" 
        element={<DemirbasDetay />} 
      />
      <Route 
        path="*" 
        element={<Navigate to={role ? (role === 'admin' ? '/admin' : '/personel') : '/login'} />} 
      />
    </Routes>
  );
}

function App() {
  const [role, setRole] = useState(localStorage.getItem('userRole') || null);

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
  };

  return (
    <Router>
      <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#f8fafc', margin: 0, padding: 0, boxSizing: 'border-box' }}>
        
        {/* ÜST GEZİNTİ VE BAŞLIK ÇUBUĞU */}
        <header style={{ 
          background: '#800020', 
          color: '#ffffff', 
          padding: '16px 32px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img 
              src="/trabzon-ortahisar-belediyesi-logo-png_seeklogo-386190.png" 
              alt="Logo" 
              style={{ height: '42px', width: 'auto' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', letterSpacing: '0.02em' }}>
                T.C. TRABZON ORTAHİSAR BELEDİYESİ
              </h1>
              <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                Bilgi İşlem Müdürlüğü • Demirbaş Takip Portalı
              </span>
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {role ? (
              <>
                {role === 'admin' ? (
                  <Link to="/admin" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
                    Yönetim Paneli
                  </Link>
                ) : (
                  <Link to="/personel" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
                    Personel Paneli
                  </Link>
                )}
                <button 
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.85rem'
                  }}
                >
                  Çıkış Yap
                </button>
              </>
            ) : (
              <Link to="/login" style={{ color: '#ffffff', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
                
              </Link>
            )}
          </nav>
        </header>

        {/* ANA İÇERİK KONTROLÜ */}
        <main style={{ width: '100%', padding: '24px 32px', boxSizing: 'border-box' }}>
          <AppRoutes role={role} setRole={setRole} />
        </main>

      </div>
    </Router>
  );
}

export default App;