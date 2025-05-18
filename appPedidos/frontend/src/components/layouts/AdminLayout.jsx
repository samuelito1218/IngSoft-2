import React, { useState } from 'react';
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
            <Link to="/admin">
              <span className="logo-text">FastFood Admin</span>
            </Link>
          </div>
          
          <button className="menu-toggle" onClick={toggleMenu}>
            {showMenu ? <FaTimes /> : <FaBars />}
          </button>
          
          <div className={`navbar ${showMenu ? 'show' : ''}`}>
            <nav className="nav-menu">
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
              <Link 
                to="/admin/perfil" 
                className={isActive('/admin/perfil') ? 'active' : ''}
                onClick={closeMenu}
              >
                <div className="user-info">
                  <div className="user-avatar">
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt="Profile" />
                    ) : (
                      user?.nombreCompleto?.charAt(0) || 'A'
                    )}
                  </div>
                  <div className="user-name">
                    {user?.nombreCompleto || 'Administrador'}
                  </div>
                </div>
              </Link>
              
              <button className="logout-button" onClick={handleLogout}>
                <FaSignOutAlt />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <main className="layout-main">
        {/* Renderizar componentes hijos usando Outlet */}
        <Outlet />
      </main>
      
      <footer className="layout-footer">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} FastFood - Administración de Restaurantes</p>
        </div>
      </footer>
    </div>
  );
};

export default AdminLayout;