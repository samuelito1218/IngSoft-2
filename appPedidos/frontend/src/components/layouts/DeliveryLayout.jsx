import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/Layout.css';

function DeliveryLayout({ children }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleStatus = () => {
    setIsOnline(!isOnline);
    // Aquí iría la lógica para actualizar el estado en la API
  };

  return (
    <div className="app-container delivery">
      <header className="app-header delivery-header">
        <div className="header-content">
          <Link to="/repartidor" className="logo">
            <span className="logo-icon">🛵</span>
            <span className="logo-text">FastFood</span>
          </Link>
          
          <div className="header-actions">
            <div className="status-toggle">
              <span className="status-label">Estado:</span>
              <button 
                className={`status-button ${isOnline ? 'online' : 'offline'}`}
                onClick={toggleStatus}
              >
                {isOnline ? '🟢 Disponible' : '🔴 No disponible'}
              </button>
            </div>
            
            <div className="user-menu">
              <div className="user-info">
                <span className="user-name">{user.nombre}</span>
                <span className="user-icon">👤</span>
              </div>
              
              <div className="dropdown-actions">
                <button className="dropdown-item" onClick={handleLogout}>
                  <span className="dropdown-icon">🚪</span>
                  <span className="dropdown-text">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="app-content delivery-content">
        {children}
      </main>
      
      <footer className="app-navigation delivery-nav">
        <Link 
          to="/repartidor" 
          className={`nav-item ${location.pathname === '/repartidor' ? 'active' : ''}`}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-text">Dashboard</span>
        </Link>
        
        <Link 
          to="/repartidor/pedidos-activos" 
          className={`nav-item ${location.pathname === '/repartidor/pedidos-activos' ? 'active' : ''}`}
        >
          <span className="nav-icon">🚚</span>
          <span className="nav-text">En curso</span>
        </Link>
        
        <Link 
          to="/repartidor/historial" 
          className={`nav-item ${location.pathname === '/repartidor/historial' ? 'active' : ''}`}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-text">Historial</span>
        </Link>
        
        <Link 
          to="/repartidor/perfil" 
          className={`nav-item ${location.pathname === '/repartidor/perfil' ? 'active' : ''}`}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-text">Perfil</span>
        </Link>
      </footer>
    </div>
  );
}

export default DeliveryLayout;