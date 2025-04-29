import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/Layout.css';

function RestaurantLayout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSidebar, setShowSidebar] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-container restaurant">
      <aside className={`sidebar ${showSidebar ? 'show' : 'hide'}`}>
        <div className="sidebar-header">
          <Link to="/restaurante" className="logo">
            <span className="logo-icon">🍔</span>
            <span className="logo-text">FastFood</span>
          </Link>
          <button 
            className="toggle-sidebar" 
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? '◀' : '▶'}
          </button>
        </div>
        
        <div className="sidebar-content">
          <div className="restaurant-info">
            <div className="restaurant-avatar">🏪</div>
            <div className="restaurant-details">
              <span className="restaurant-name">{user.nombre}</span>
              <span className="restaurant-status online">Online</span>
            </div>
          </div>
          
          <nav className="sidebar-nav">
            <Link 
              to="/restaurante" 
              className={`nav-item ${location.pathname === '/restaurante' ? 'active' : ''}`}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Dashboard</span>
            </Link>
            
            <Link 
              to="/restaurante/pedidos" 
              className={`nav-item ${location.pathname === '/restaurante/pedidos' ? 'active' : ''}`}
            >
              <span className="nav-icon">📦</span>
              <span className="nav-text">Pedidos</span>
            </Link>
            
            <Link 
              to="/restaurante/menu" 
              className={`nav-item ${location.pathname === '/restaurante/menu' ? 'active' : ''}`}
            >
              <span className="nav-icon">🍽️</span>
              <span className="nav-text">Menú</span>
            </Link>
            
            <Link 
              to="/restaurante/reportes" 
              className={`nav-item ${location.pathname === '/restaurante/reportes' ? 'active' : ''}`}
            >
              <span className="nav-icon">📈</span>
              <span className="nav-text">Reportes</span>
            </Link>
            
            <Link 
              to="/restaurante/configuracion" 
              className={`nav-item ${location.pathname === '/restaurante/configuracion' ? 'active' : ''}`}
            >
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Configuración</span>
            </Link>
          </nav>
        </div>
        
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
      
      <div className="main-content">
        <header className="restaurant-header">
          <div className="page-title">
            {location.pathname === '/restaurante' && 'Dashboard'}
            {location.pathname === '/restaurante/pedidos' && 'Gestión de Pedidos'}
            {location.pathname === '/restaurante/menu' && 'Gestión de Menú'}
            {location.pathname === '/restaurante/reportes' && 'Reportes'}
            {location.pathname === '/restaurante/configuracion' && 'Configuración'}
          </div>
          
          <div className="header-actions">
            <button className="notification-button">
              <span className="icon">🔔</span>
              <span className="badge">3</span>
            </button>
            
            <div className="user-info">
              <span className="user-name">{user.nombre}</span>
              <span className="user-icon">👤</span>
            </div>
          </div>
        </header>
        
        <main className="restaurant-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default RestaurantLayout;