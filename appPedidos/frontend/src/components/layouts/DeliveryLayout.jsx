// src/components/layouts/DeliveryLayout.jsx (modified)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/Layout.css';

function DeliveryLayout({ children }) {
  const { logout, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(true);
  const [activePedido, setActivePedido] = useState(null);

  // Efecto para verificar la autenticación
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Usuario no autenticado en DeliveryLayout, redirigiendo a login");
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Efecto para verificar el rol
  useEffect(() => {
    if (user && user.rol && user.rol !== 'Repartidor' && user.rol !== 'repartidor') {
      console.log(`Rol incorrecto en DeliveryLayout: ${user.rol}, redirigiendo a la página correspondiente`);
      
      // Redirigir al layout correcto según el rol
      if (user.rol === 'Cliente' || user.rol === 'cliente') {
        navigate('/cliente');
      } else if (user.rol === 'Restaurante' || user.rol === 'restaurante') {
        navigate('/restaurante');
      }
    }
  }, [user, navigate]);

  // Cargar pedido activo
  useEffect(() => {
    if (isAuthenticated && user) {
      const loadActivePedido = async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/pedidos/repartidor/activo`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data && data.pedido) {
              setActivePedido(data.pedido);
            }
          }
        } catch (error) {
          console.error("Error al cargar el pedido activo:", error);
        }
      };
      
      loadActivePedido();
    }
  }, [isAuthenticated, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleStatus = async () => {
    try {
      // Aquí llamarías a la API para cambiar tu estado
      // await api.post('/repartidor/cambiar-estado', { online: !isOnline });
      
      setIsOnline(!isOnline);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
    }
  };

  // Si no hay usuario, mostrar un mensaje de carga
  if (!user) {
    return <div className="loading-container">Cargando...</div>;
  }

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
            
            {/* Botón de navegación si hay un pedido activo */}
            {activePedido && (
              <button 
                className="navigation-button" 
                onClick={() => navigate(`/repartidor/pedidos-activos/${activePedido.id}`)}
                title="Ir a navegación de pedido actual"
              >
                <span className="icon">🗺️</span>
              </button>
            )}
            
            <div className="user-menu">
              <div className="user-info">
                <span className="user-name">{user.nombreCompleto || "Repartidor"}</span>
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
          className={`nav-item ${location.pathname.includes('/repartidor/pedidos-activos') ? 'active' : ''}`}
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