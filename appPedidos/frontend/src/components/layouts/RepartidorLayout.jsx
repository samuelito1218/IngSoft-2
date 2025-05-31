import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, FaMotorcycle, FaHistory, 
  FaUser, FaSignOutAlt, FaBars, FaTimes, FaMapMarked 
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import './layouts.css';
import FloatingChatButton from '../shared/FloatingChatButton';

class Nodo {
  constructor(valor) {
    this.valor = valor;
    this.hijos = [];
  }

  agregarHijo(nodo) {
    this.hijos.push(nodo);
  }
}

class RepartidorMenuTree {
  constructor() {
    this.root = null;
    this.initializeTree();
  }

  initializeTree() {
    this.root = new Nodo({
      title: "Repartidor Menu Principal",
      link: "/repartidor",
      component: "root",
      key: "root",
      icon: null
    });

    const homeMenu = new Nodo({
      title: "Inicio",
      link: "/repartidor",
      component: "home",
      key: "home",
      icon: FaHome
    });

    const pedidosDisponiblesMenu = new Nodo({
      title: "Pedidos Disponibles",
      link: "/repartidor/pedidos-disponibles",
      component: "pedidos-disponibles",
      key: "pedidos-disponibles",
      icon: FaMotorcycle
    });

    const pedidosActivosMenu = new Nodo({
      title: "Mis Entregas",
      link: "/repartidor/pedidos-activos",
      component: "pedidos-activos",
      key: "pedidos-activos",
      icon: FaMapMarked,
      hasCounter: true
    });

    const historialMenu = new Nodo({
      title: "Historial",
      link: "/repartidor/historial",
      component: "historial",
      key: "historial",
      icon: FaHistory
    });

    const userMenu = new Nodo({
      title: "Usuario",
      link: "#",
      component: "user",
      key: "user",
      icon: FaUser
    });

    const perfilSubmenu = new Nodo({
      title: "Perfil",
      link: "/repartidor/perfil",
      component: "perfil",
      key: "perfil",
      icon: FaUser
    });

    const logoutSubmenu = new Nodo({
      title: "Cerrar sesión",
      link: "#",
      component: "logout",
      key: "logout",
      icon: FaSignOutAlt
    });

    userMenu.agregarHijo(perfilSubmenu);
    userMenu.agregarHijo(logoutSubmenu);

    this.root.agregarHijo(homeMenu);
    this.root.agregarHijo(pedidosDisponiblesMenu);
    this.root.agregarHijo(pedidosActivosMenu);
    this.root.agregarHijo(historialMenu);
    this.root.agregarHijo(userMenu);
  }

  dfs(nodo, targetKey) {
    if (!nodo) return null;
    
    if (nodo.valor.key === targetKey) {
      return nodo;
    }

    for (let hijo of nodo.hijos) {
      const resultado = this.dfs(hijo, targetKey);
      if (resultado) return resultado;
    }

    return null;
  }

  bfs() {
    if (!this.root) return [];
    
    const cola = [this.root];
    const resultado = [];
    
    while (cola.length > 0) {
      const actual = cola.shift();
      
      if (actual === this.root) {
        for (let hijo of actual.hijos) {
          if (hijo.valor.key !== 'user') {
            resultado.push(hijo);
          }
        }
      }
    }
    
    return resultado;
  }

  getUserSubmenus() {
    const userNode = this.dfs(this.root, 'user');
    return userNode ? userNode.hijos : [];
  }

  findMenu(key) {
    return this.dfs(this.root, key);
  }

  getAllMenus() {
    const menus = [];
    
    function dfsTraversal(nodo) {
      if (!nodo) return;
      
      if (nodo.valor.key !== 'root') {
        menus.push(nodo);
      }
      
      for (let hijo of nodo.hijos) {
        dfsTraversal(hijo);
      }
    }
    
    dfsTraversal(this.root);
    return menus;
  }
}

const RepartidorLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [activePedidos, setActivePedidos] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  const [menuTree] = useState(new RepartidorMenuTree());
  const [navigationMenus, setNavigationMenus] = useState([]);
  const [userSubmenus, setUserSubmenus] = useState([]);
  
  useEffect(() => {
    const navMenus = menuTree.bfs();
    setNavigationMenus(navMenus);
    
    const userSubs = menuTree.getUserSubmenus();
    setUserSubmenus(userSubs);
  }, [menuTree]);
  
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  const handleMenuAction = (menuKey) => {
    const menuNode = menuTree.findMenu(menuKey);
    
    if (menuNode) {
      const menuData = menuNode.valor;
      
      switch (menuKey) {
        case 'logout':
          handleLogout();
          break;
        case 'perfil':
          closeMenu();
          navigate(menuData.link);
          break;
        default:
          if (menuData.link && menuData.link !== '#') {
            closeMenu();
            navigate(menuData.link);
          }
          break;
      }
    }
  };
  
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
        
      }
    };
    
    const interval = setInterval(checkActivePedidos, 30000);
    checkActivePedidos();
    
    return () => clearInterval(interval);
  }, [location]);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };
  
  const closeMenu = () => {
    setShowMenu(false);
  };

  const handleImageError = (e) => {
    setImageError(true);
    e.target.style.display = 'none';
  };

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

  const shouldShowImage = () => {
    return user?.imageUrl && 
           !imageError && 
           user.imageUrl !== 'undefined' && 
           user.imageUrl !== 'null' && 
           user.imageUrl.trim() !== '';
  };

  const handleUserInfoClick = (e) => {
    e.preventDefault();
    handleMenuAction('perfil');
  };

  const renderNavigationMenus = () => {
    return navigationMenus.map((menuNode) => {
      const menuData = menuNode.valor;
      const IconComponent = menuData.icon;
      
      return (
        <Link 
          key={menuData.key}
          to={menuData.link} 
          className={isActive(menuData.link) ? 'active' : ''}
          onClick={closeMenu}
        >
          <div className={menuData.hasCounter ? "icon-badge-container" : ""}>
            <IconComponent />
            {menuData.hasCounter && activePedidos > 0 && (
              <span className="count-badge">{activePedidos}</span>
            )}
          </div>
          <span>{menuData.title}</span>
        </Link>
      );
    });
  };

  const renderUserSubmenus = () => {
    return userSubmenus.map((submenuNode) => {
      const submenuData = submenuNode.valor;
      const IconComponent = submenuData.icon;
      
      return (
        <button 
          key={submenuData.key}
          onClick={() => handleMenuAction(submenuData.key)}
          className={submenuData.key === 'logout' ? 'logout-button' : 'user-submenu-button'}
        >
          <IconComponent />
          <span>{submenuData.title}</span>
        </button>
      );
    });
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
              {renderNavigationMenus()}
            </nav>
            
            <div className="user-section">
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