import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import TraCuuCKS from './components/TraCuuCKS';
import { cookieUtils } from './utils/cookies';
import { autoLogin } from './services/auth';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('tra-cuu-cks');

  // Kiểm tra đăng nhập khi component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const hasLoginInfo = cookieUtils.isLoggedIn();
        if (hasLoginInfo) {
          // Thử đăng nhập tự động
          await autoLogin();
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auto login failed:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (result) => {
    console.log('Login successful, token:', result.token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    cookieUtils.clearAll();
    setIsAuthenticated(false);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'tra-cuu-cks':
        return <TraCuuCKS />;
      default:
        return <TraCuuCKS />;
    }
  };

  if (loading) {
    return (
      <div className="App">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <p>Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="App">
      <Layout 
        activeMenu={activeMenu} 
        onMenuChange={setActiveMenu}
      >
        {renderContent()}
        <div style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px' 
        }}>
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: '#ff4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            Đăng xuất
          </button>
        </div>
      </Layout>
    </div>
  );
}

export default App;
