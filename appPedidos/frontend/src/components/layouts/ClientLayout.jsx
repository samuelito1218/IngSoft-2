// src/components/layouts/ClientLayout.jsx
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
              <div className="user-info">
                <div className="user-avatar">
                  {user?.nombreCompleto?.charAt(0) || 'U'}
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