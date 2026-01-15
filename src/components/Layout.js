import React from 'react';
import './Layout.css';

const Layout = ({ children, activeMenu, onMenuChange }) => {
  const menuItems = [
    { id: 'tra-cuu-cks', label: 'Tra cứu CKS' },
    // Có thể thêm các menu khác sau
  ];

  return (
    <div className="layout-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Tool hỗ trợ tối ưu kế toán</h1>
          <nav className="main-nav">
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
                onClick={() => onMenuChange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

export default Layout;
