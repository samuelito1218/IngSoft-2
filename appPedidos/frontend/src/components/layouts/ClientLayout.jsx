// src/components/layouts/ClientLayout.jsx (modified)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/Layout.css';
import { ShoppingCart, User, MapPin, Home, Search, ShoppingBag, Heart } from "lucide-react";

function ClientLayout({ children }) {
  const { logout, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [activePedido, setActivePedido] = useState(null);

  // Efecto para verificar la autenticación
  useEffect(() => {
    if (!isAuthenticated) {
      console.log("Usuario no autenticado en ClientLayout, redirigiendo a login");
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Efecto para verificar el rol
  useEffect(() => {
    if (user && user.rol && user.rol !== 'Cliente' && user.rol !== 'cliente') {
      console.log(`Rol incorrecto en ClientLayout: ${user.rol}, redirigiendo a la página correspondiente`);
      
      // Redirigir al layout correcto según el rol
      if (user.rol === 'Repartidor' || user.rol === 'repartidor') {
        navigate('/repartidor');
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
          const response = await fetch(`http://localhost:5000/api/pedidos/cliente/activo`, {
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

  const closeMenu = () => {
    setShowMenu(false);
  };

  // Si no hay usuario, mostrar un mensaje de carga
  if (!user) {
    return <div className="loading-container">Cargando...</div>;
  }

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
              <ShoppingCart size={20} />
            </button>
            
            {/* Botón de seguimiento de pedido si hay un pedido activo */}
            {activePedido && (
              <button 
                className="tracking-button" 
                onClick={() => navigate(`/cliente/delivery-tracking/${activePedido.id}`)}
                title="Seguir mi pedido actual"
              >
                <MapPin size={20} />
              </button>
            )}
            
            <div className="user-menu">
              <button 
                className="profile-button" 
                onClick={() => setShowMenu(!showMenu)}
              >
                <User size={20} />
              </button>
              
              {showMenu && (
                <div className="menu-dropdown">
                  <div className="user-info">
                    <span className="user-name">{user.nombreCompleto || "Usuario"}</span>
                    <span className="user-email">{user.email || "email@example.com"}</span>
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
          <Home size={20} />
          <span className="nav-text">Inicio</span>
        </Link>
        
        <Link 
          to="/cliente/buscar" 
          className={`nav-item ${location.pathname === '/cliente/buscar' ? 'active' : ''}`}
        >
          <Search size={20} />
          <span className="nav-text">Buscar</span>
        </Link>
        
        <Link 
          to="/cliente/pedidos" 
          className={`nav-item ${location.pathname === '/cliente/pedidos' ? 'active' : ''}`}
        >
          <ShoppingBag size={20} />
          <span className="nav-text">Pedidos</span>
        </Link>
        
        <Link 
          to="/cliente/favoritos" 
          className={`nav-item ${location.pathname === '/cliente/favoritos' ? 'active' : ''}`}
        >
          <Heart size={20} />
          <span className="nav-text">Favoritos</span>
        </Link>
      </footer>
    </div>
  );
}

export default ClientLayout;