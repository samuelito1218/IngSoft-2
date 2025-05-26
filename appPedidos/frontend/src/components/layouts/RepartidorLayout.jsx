// src/components/layouts/RepartidorLayout.jsx - CON IMAGEN DE PERFIL CORREGIDA
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, FaMotorcycle, FaHistory, 
  FaUser, FaSignOutAlt, FaBars, FaTimes, FaMapMarked 
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import './layouts.css';
import FloatingChatButton from '../shared/FloatingChatButton';

const RepartidorLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [activePedidos, setActivePedidos] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  // Verificar si una ruta está activa
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Obtener cantidad de pedidos activos
  useEffect(() => {
    const checkActivePedidos = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/pedidos/repartidor/activos', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setActivePedidos(data.length || 0);
        }
      } catch (error) {
        console.error('Error al obtener pedidos activos:', error);
      }
    };
    
    const interval = setInterval(checkActivePedidos, 30000); // Verificar cada 30 segundos
    checkActivePedidos(); // Verificar al inicio
    
    return () => clearInterval(interval);
  }, [location]);
  
  // Manejar cierre de sesión
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // Alternar menú en móvil
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };
  
  // Cerrar menú al hacer clic en un enlace
  const closeMenu = () => {
    setShowMenu(false);
  };

  // Manejar error de imagen de perfil
  const handleImageError = (e) => {
    console.log('Error cargando imagen de perfil del repartidor:', e);
    setImageError(true);
    // Ocultar la imagen problemática
    e.target.style.display = 'none';
  };

  // Obtener iniciales del usuario
  const getUserInitials = () => {
    if (user?.nombreCompleto) {
      const names = user.nombreCompleto.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return names[0].charAt(0).toUpperCase();
    }
    return 'R';
  };

  // Verificar si debe mostrar imagen
  const shouldShowImage = () => {
    return user?.imageUrl && 
           !imageError && 
           user.imageUrl !== 'undefined' && 
           user.imageUrl !== 'null' && 
           user.imageUrl.trim() !== '';
  };

  // Manejar click en perfil
  const handleUserInfoClick = (e) => {
    e.preventDefault();
    closeMenu();
    navigate('/repartidor/perfil');
  };
  
  return (
    <div className="layout-container">
      <div className="layout-header">
        <div className="header-container">
          <div className="logo">
            <Link to="/repartidor">
              <span className="logo-text">FastFood</span>
            </Link>
          </div>
          
          <button className="menu-toggle" onClick={toggleMenu}>
            {showMenu ? <FaTimes /> : <FaBars />}
          </button>
          
          <div className={`navbar ${showMenu ? 'show' : ''}`}>
            <nav className="nav-menu">
              <Link 
                to="/repartidor" 
                className={isActive('/repartidor') ? 'active' : ''}
                onClick={closeMenu}
              >
                <FaHome />
                <span>Inicio</span>
              </Link>
              
              <Link 
                to="/repartidor/pedidos-disponibles" 
                className={isActive('/repartidor/pedidos-disponibles') ? 'active' : ''}
                onClick={closeMenu}
              >
                <FaMotorcycle />
                <span>Pedidos Disponibles</span>
              </Link>
              
              <Link 
                to="/repartidor/pedidos-activos" 
                className={isActive('/repartidor/pedidos-activos') ? 'active' : ''}
                onClick={closeMenu}
              >
                <div className="icon-badge-container">
                  <FaMapMarked />
                  {activePedidos > 0 && (
                    <span className="count-badge">{activePedidos}</span>
                  )}
                </div>
                <span>Mis Entregas</span>
              </Link>
              
              <Link 
                to="/repartidor/historial" 
                className={isActive('/repartidor/historial') ? 'active' : ''}
                onClick={closeMenu}
              >
                <FaHistory />
                <span>Historial</span>
              </Link>
            </nav>
            
            <div className="user-section">
              {/* SECCIÓN DE USUARIO CON IMAGEN DE PERFIL CORREGIDA */}
              <div 
                className={`user-info ${isActive('/repartidor/perfil') ? 'active' : ''}`}
                onClick={handleUserInfoClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleUserInfoClick(e);
                  }
                }}
                style={{ cursor: 'pointer', textDecoration: 'none' }}
              >
                {/* AVATAR COMPLETAMENTE CONTROLADO */}
                <div 
                  className="user-avatar"
                  data-initials={getUserInitials()}
                >
                  {shouldShowImage() ? (
                    <img 
                      src={user.imageUrl} 
                      alt={`${user?.nombreCompleto || 'Repartidor'} profile`}
                      onError={handleImageError}
                      onLoad={() => setImageError(false)}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%',
                        display: 'block'
                      }}
                    />
                  ) : (
                    <span style={{ 
                      color: 'white', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%'
                    }}>
                      {getUserInitials()}
                    </span>
                  )}
                </div>
                <div className="user-name">
                  {user?.nombreCompleto || 'Repartidor'}
                </div>
              </div>
              
              <button className="logout-button" onClick={handleLogout}>
                <FaSignOutAlt />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <main className="layout-main">
        {children}
      </main>
      
      <footer className="layout-footer">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} FastFood - Todos los derechos reservados</p>
        </div>
      </footer>
      <FloatingChatButton />
    </div>
  );
};

export default RepartidorLayout;