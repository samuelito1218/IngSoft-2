import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/Layout.css';

function ClientLayout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMenu = () => {
    setShowMenu(false);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <Link to="/cliente" className="logo">
            <span className="logo-icon">🍔</span>
            <span className="logo-text">FastFood</span>
          </Link>
          
          <div className="header-actions">
            <button className="cart-button" onClick={() => navigate('/cliente/carrito')}>
              <span className="icon">🛒</span>
            </button>
            
            <div className="user-menu">
              <button 
                className="profile-button" 
                onClick={() => setShowMenu(!showMenu)}
              >
                <span className="profile-icon">👤</span>
              </button>
              
              {showMenu && (
                <div className="menu-dropdown">
                  <div className="user-info">
                    <span className="user-name">{user.nombre}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                  
                  <div className="menu-options">
                    <Link to="/cliente/pedidos" className="menu-item" onClick={closeMenu}>
                      <span className="menu-icon">📋</span>
                      <span>Mis Pedidos</span>
                    </Link>
                    
                    <Link to="/cliente/perfil" className="menu-item" onClick={closeMenu}>
                      <span className="menu-icon">⚙️</span>
                      <span>Mi Perfil</span>
                    </Link>
                    
                    <button className="menu-item logout" onClick={handleLogout}>
                      <span className="menu-icon">🚪</span>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="app-content">
        {children}
      </main>
      
      <footer className="app-navigation">
        <Link 
          to="/cliente" 
          className={`nav-item ${location.pathname === '/cliente' ? 'active' : ''}`}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-text">Inicio</span>
        </Link>
        
        <Link 
          to="/cliente/buscar" 
          className={`nav-item ${location.pathname === '/cliente/buscar' ? 'active' : ''}`}
        >
          <span className="nav-icon">🔍</span>
          <span className="nav-text">Buscar</span>
        </Link>
        
        <Link 
          to="/cliente/pedidos" 
          className={`nav-item ${location.pathname === '/cliente/pedidos' ? 'active' : ''}`}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-text">Pedidos</span>
        </Link>
        
        <Link 
          to="/cliente/favoritos" 
          className={`nav-item ${location.pathname === '/cliente/favoritos' ? 'active' : ''}`}
        >
          <span className="nav-icon">❤️</span>
          <span className="nav-text">Favoritos</span>
        </Link>
      </footer>
    </div>
  );
}

export default ClientLayout;