import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaUtensils, FaClipboardList, FaStore, FaUserCog, FaBars, FaTimes, FaBell, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
//import '../layouts/layouts.css';
import './RestaurantManagement.css';

const RestaurantLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Este es un menú de navegación básico para la sección de restaurante
  const navItems = [
    {
      title: 'Dashboard',
      icon: <FaHome />,
      path: '/restaurante'
    },
    {
      title: 'Gestión de Menú',
      icon: <FaUtensils />,
      path: '/restaurante/menu'
    },
    {
      title: 'Gestión de Pedidos',
      icon: <FaClipboardList />,
      path: '/restaurante/pedidos'
    },
    {
      title: 'Mis Restaurantes',
      icon: <FaStore />,
      path: '/restaurante/mis-restaurantes'
    },
    {
      title: 'Perfil',
      icon: <FaUserCog />,
      path: '/restaurante/perfil'
    }
  ];

  return (
    <div className="restaurant-layout">
      {/* Sidebar para navegación */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Panel Restaurante</h2>
          <button className="close-btn" onClick={toggleSidebar}>
            <FaTimes />
          </button>
        </div>
        
        <div className="user-info">
          <div className="user-avatar">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="Perfil" />
            ) : (
              <div className="avatar-placeholder">
                {user?.nombreCompleto?.charAt(0).toUpperCase() || 'R'}
              </div>
            )}
          </div>
          <div className="user-details">
            <h3>{user?.nombreCompleto || 'Restaurante'}</h3>
            <p>{user?.email}</p>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item, index) => (
              <li key={index}>
                <Link 
                  to={item.path} 
                  className={location.pathname === item.path ? 'active' : ''}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-title">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
      
      {/* Contenido principal */}
      <div className="main-content">
        <header className="restaurant-header">
          <button className="menu-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
          
          <div className="header-title">
            <h1>{navItems.find(item => item.path === location.pathname)?.title || 'Panel de Restaurante'}</h1>
          </div>
          
          <div className="header-actions">
            <div className="notifications">
              <button className="notification-btn">
                <FaBell />
                {notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </button>
            </div>
          </div>
        </header>
        
        <main className="content">
          {children}
        </main>
        
        <footer className="restaurant-footer">
          <p>&copy; {new Date().getFullYear()} App de Pedidos - Panel de Restaurante</p>
        </footer>
      </div>
      
      {/* Overlay para cerrar sidebar en móviles */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};

export default RestaurantLayout;