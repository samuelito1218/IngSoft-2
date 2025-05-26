// components/layouts/AdminLayout.jsx - VERSIÓN COMPLETA CON CARGA INMEDIATA
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  FaHome, FaStore, FaUtensils, FaClipboardList, 
  FaUser, FaSignOutAlt, FaBars, FaTimes, FaPlus, 
  FaChartLine, FaCog
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import './layouts.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  
  // ESTADOS PARA MANEJO DE IMAGEN DE PERFIL
  const [userImageUrl, setUserImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [userLoaded, setUserLoaded] = useState(false);

  // EFECTO PARA CARGAR IMAGEN CUANDO EL USUARIO ESTÉ DISPONIBLE
  useEffect(() => {
    if (user) {
      setUserLoaded(true);
      
      // Cargar imagen de perfil si existe
      if (user.imageUrl && user.imageUrl.trim() !== '' && 
          user.imageUrl !== 'undefined' && user.imageUrl !== 'null') {
        setUserImageUrl(user.imageUrl);
        setImageError(false);
      } else {
        setUserImageUrl(null);
      }
    }
  }, [user]);

  // EFECTO PARA VERIFICAR IMAGEN PERIÓDICAMENTE
  useEffect(() => {
    if (user?.imageUrl && !userImageUrl && !imageError) {
      const checkImage = () => {
        if (user.imageUrl && user.imageUrl.trim() !== '') {
          setUserImageUrl(user.imageUrl);
        }
      };
      
      const interval = setInterval(checkImage, 1000);
      
      setTimeout(() => {
        clearInterval(interval);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [user, userImageUrl, imageError]);
  
  // Verificar si una ruta está activa
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
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

  // Manejar click en perfil
  const handleUserInfoClick = (e) => {
    e.preventDefault();
    closeMenu();
    navigate('/admin/perfil');
  };

  // Manejar error de imagen
  const handleImageError = (e) => {
    console.log('Error cargando imagen de perfil:', e);
    setImageError(true);
    setUserImageUrl(null);
    e.target.style.display = 'none';
  };

  // Manejar carga exitosa de imagen
  const handleImageLoad = () => {
    setImageError(false);
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
    return 'A';
  };

  // Verificar si debe mostrar imagen
  const shouldShowImage = () => {
    return userLoaded && 
           userImageUrl && 
           !imageError && 
           userImageUrl !== 'undefined' && 
           userImageUrl !== 'null' && 
           userImageUrl.trim() !== '';
  };
  
  return (
    <div className="layout-container">
      <div className="layout-header">
        <div className="header-container">
          <div className="logo">
            <Link to="/admin" onClick={closeMenu}>
              <span className="logo-text">FastFood Admin</span>
            </Link>
          </div>
          
          <button 
            className="menu-toggle" 
            onClick={toggleMenu}
            aria-label="Toggle menu"
            type="button"
          >
            {showMenu ? <FaTimes /> : <FaBars />}
          </button>
          
          <div className={`navbar ${showMenu ? 'show' : ''}`}>
            <nav className="nav-menu" role="navigation">
              <Link 
                to="/admin" 
                className={isActive('/admin') && !isActive('/admin/restaurantes/nuevo') && !isActive('/admin/productos') ? 'active' : ''}
                onClick={closeMenu}
              >
                <FaHome />
                <span>Dashboard</span>
              </Link>
              
              <Link 
                to="/admin/restaurantes" 
                className={isActive('/admin/restaurantes') && !isActive('/admin/restaurantes/nuevo') ? 'active' : ''}
                onClick={closeMenu}
              >
                <FaStore />
                <span>Mis Restaurantes</span>
              </Link>
              
              <Link 
                to="/admin/restaurantes/nuevo" 
                className={isActive('/admin/restaurantes/nuevo') ? 'active' : ''}
                onClick={closeMenu}
              >
                <FaPlus />
                <span>Nuevo Restaurante</span>
              </Link>
              
              <Link 
                to="/admin/pedidos" 
                className={isActive('/admin/pedidos') ? 'active' : ''}
                onClick={closeMenu}
              >
                <FaClipboardList />
                <span>Pedidos</span>
              </Link>
              
              <Link 
                to="/admin/estadisticas" 
                className={isActive('/admin/estadisticas') ? 'active' : ''}
                onClick={closeMenu}
              >
                <FaChartLine />
                <span>Estadísticas</span>
              </Link>
            </nav>
            
            <div className="user-section">
              <div 
                className={`user-info ${isActive('/admin/perfil') ? 'active' : ''}`}
                onClick={handleUserInfoClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleUserInfoClick(e);
                  }
                }}
              >
                {/* AVATAR CON CARGA MEJORADA */}
                <div 
                  className="user-avatar"
                  data-initials={getUserInitials()}
                >
                  {shouldShowImage() ? (
                    <img 
                      src={userImageUrl} 
                      alt={`${user?.nombreCompleto || 'Admin'} profile`}
                      onError={handleImageError}
                      onLoad={handleImageLoad}
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
                      {userLoaded ? getUserInitials() : '...'}
                    </span>
                  )}
                </div>
                <div className="user-name">
                  {user?.nombreCompleto || 'Cargando...'}
                </div>
              </div>
              
              <button 
                className="logout-button" 
                onClick={handleLogout}
                type="button"
                aria-label="Cerrar sesión"
              >
                <FaSignOutAlt />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <main className="layout-main" role="main">
        <React.Suspense fallback={
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Cargando...</p>
          </div>
        }>
          <Outlet />
        </React.Suspense>
      </main>
      
      <footer className="layout-footer" role="contentinfo">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} FastFood - Administración de Restaurantes</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;