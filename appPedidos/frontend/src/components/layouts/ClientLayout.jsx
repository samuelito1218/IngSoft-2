// src/components/layouts/ClientLayout.jsx - CON IMAGEN DE PERFIL CORREGIDA
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, FaUtensils, FaShoppingCart, FaHistory, 
  FaUser, FaSignOutAlt, FaBars, FaTimes 
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import './layouts.css';

const ClientLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  // Obtener cantidad de items en carrito desde localStorage
  useEffect(() => {
    const checkCartItems = () => {
      try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
          const parsedCart = JSON.parse(cartData);
          let count = 0;
          
          // Sumar todas las cantidades
          parsedCart.forEach(item => {
            count += item.quantity;
          });
          
          setCartItemsCount(count);
        } else {
          setCartItemsCount(0);
        }
      } catch (error) {
        console.error('Error al obtener items del carrito:', error);
        setCartItemsCount(0);
      }
    };
    
    // Verificar al cargar y cada vez que cambia la ubicación
    checkCartItems();
    
    // Añadir event listener para storage changes
    const handleStorageChange = () => {
      checkCartItems();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // También podemos verificar periódicamente
    const interval = setInterval(checkCartItems, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [location]);
  
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

  // Manejar error de imagen de perfil
  const handleImageError = (e) => {
    console.log('Error cargando imagen de perfil del cliente:', e);
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
    return 'U';
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
    navigate('/cliente/perfil');
  };
  
  return (
    <div className="layout-container">
      <div className="layout-header">
        <div className="header-container">
          <div className="logo">
            <Link to="/cliente">
              <span className="logo-text">FastFood</span>
            </Link>
          </div>
          
          <button className="menu-toggle" onClick={toggleMenu}>
            {showMenu ? <FaTimes /> : <FaBars />}
          </button>
          
          <div className={`navbar ${showMenu ? 'show' : ''}`}>
            <nav className="nav-menu">
              <Link 
                to="/cliente" 
                className={isActive('/cliente') ? 'active' : ''}
                onClick={closeMenu}
              >
                <FaHome />
                <span>Inicio</span>
              </Link>
              
              <Link 
                to="/cliente/pedidos" 
                className={isActive('/cliente/pedidos') ? 'active' : ''}
                onClick={closeMenu}
              >
                <FaHistory />
                <span>Mis Pedidos</span>
              </Link>
              
              <Link 
                to="/cliente/carrito" 
                className={isActive('/cliente/carrito') ? 'active' : ''}
                onClick={closeMenu}
              >
                <div className="cart-icon-container">
                  <FaShoppingCart />
                  {cartItemsCount > 0 && (
                    <span className="cart-badge">{cartItemsCount}</span>
                  )}
                </div>
                <span>Carrito</span>
              </Link>
            </nav>
            
            <div className="user-section">
              {/* SECCIÓN DE USUARIO CON IMAGEN DE PERFIL CORREGIDA */}
              <div 
                className={`user-info ${isActive('/cliente/perfil') ? 'active' : ''}`}
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
                      alt={`${user?.nombreCompleto || 'Usuario'} profile`}
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
                  {user?.nombreCompleto || 'Usuario'}
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
    </div>
  );
};

export default ClientLayout;