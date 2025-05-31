import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  FaHome, FaStore, FaUtensils, FaClipboardList, 
  FaUser, FaSignOutAlt, FaBars, FaTimes, FaPlus, 
  FaChartLine, FaCog
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import './layouts.css';

class Nodo {
  constructor(valor) {
    this.valor = valor;
    this.hijos = [];
  }

  agregarHijo(nodo) {
    this.hijos.push(nodo);
  }
}

class AdminMenuTree {
  constructor() {
    this.root = null;
    this.initializeTree();
  }

  initializeTree() {
    this.root = new Nodo({
      title: "Admin Menu Principal",
      path: "/admin",
      component: "root",
      key: "root",
      icon: null
    });
    const dashboardMenu = new Nodo({
      title: "Dashboard",
      path: "/admin",
      component: "dashboard",
      key: "dashboard",
      icon: FaHome,
      exactMatch: true
    });

    const restaurantesMenu = new Nodo({
      title: "Mis Restaurantes",
      path: "/admin/restaurantes",
      component: "restaurantes",
      key: "restaurantes",
      icon: FaStore
    });

    const listarRestaurantesSubmenu = new Nodo({
      title: "Listar Restaurantes",
      path: "/admin/restaurantes",
      component: "listar-restaurantes",
      key: "listar-restaurantes",
      icon: FaStore
    });

    const nuevoRestauranteSubmenu = new Nodo({
      title: "Nuevo Restaurante",
      path: "/admin/restaurantes/nuevo",
      component: "nuevo-restaurante",
      key: "nuevo-restaurante",
      icon: FaPlus
    });

    const editarRestauranteSubmenu = new Nodo({
      title: "Editar Restaurante",
      path: "/admin/restaurantes/editar",
      component: "editar-restaurante",
      key: "editar-restaurante",
      icon: FaCog
    });

    restaurantesMenu.agregarHijo(listarRestaurantesSubmenu);
    restaurantesMenu.agregarHijo(nuevoRestauranteSubmenu);
    restaurantesMenu.agregarHijo(editarRestauranteSubmenu);

    const nuevoRestauranteMenu = new Nodo({
      title: "Nuevo Restaurante",
      path: "/admin/restaurantes/nuevo",
      component: "nuevo-restaurante-main",
      key: "nuevo-restaurante-main",
      icon: FaPlus
    });

    const pedidosMenu = new Nodo({
      title: "Pedidos",
      path: "/admin/pedidos",
      component: "pedidos",
      key: "pedidos",
      icon: FaClipboardList
    });

    const pedidosActivosSubmenu = new Nodo({
      title: "Pedidos Activos",
      path: "/admin/pedidos/activos",
      component: "pedidos-activos",
      key: "pedidos-activos",
      icon: FaClipboardList
    });

    const historialPedidosSubmenu = new Nodo({
      title: "Historial de Pedidos",
      path: "/admin/pedidos/historial",
      component: "historial-pedidos",
      key: "historial-pedidos",
      icon: FaClipboardList
    });

    const reportesPedidosSubmenu = new Nodo({
      title: "Reportes de Pedidos",
      path: "/admin/pedidos/reportes",
      component: "reportes-pedidos",
      key: "reportes-pedidos",
      icon: FaChartLine
    });

    pedidosMenu.agregarHijo(pedidosActivosSubmenu);
    pedidosMenu.agregarHijo(historialPedidosSubmenu);
    pedidosMenu.agregarHijo(reportesPedidosSubmenu);

    const estadisticasMenu = new Nodo({
      title: "Estadísticas",
      path: "/admin/estadisticas",
      component: "estadisticas",
      key: "estadisticas",
      icon: FaChartLine
    });

    const ventasSubmenu = new Nodo({
      title: "Estadísticas de Ventas",
      path: "/admin/estadisticas/ventas",
      component: "estadisticas-ventas",
      key: "estadisticas-ventas",
      icon: FaChartLine
    });

    const usuariosSubmenu = new Nodo({
      title: "Estadísticas de Usuarios",
      path: "/admin/estadisticas/usuarios",
      component: "estadisticas-usuarios",
      key: "estadisticas-usuarios",
      icon: FaUser
    });

    const restaurantesStatsSubmenu = new Nodo({
      title: "Estadísticas de Restaurantes",
      path: "/admin/estadisticas/restaurantes",
      component: "estadisticas-restaurantes",
      key: "estadisticas-restaurantes",
      icon: FaStore
    });

    estadisticasMenu.agregarHijo(ventasSubmenu);
    estadisticasMenu.agregarHijo(usuariosSubmenu);
    estadisticasMenu.agregarHijo(restaurantesStatsSubmenu);

    const userMenu = new Nodo({
      title: "Usuario",
      path: "#",
      component: "user",
      key: "user",
      icon: FaUser
    });

    const perfilSubmenu = new Nodo({
      title: "Perfil",
      path: "/admin/perfil",
      component: "perfil",
      key: "perfil",
      icon: FaUser
    });

    const configuracionSubmenu = new Nodo({
      title: "Configuración",
      path: "/admin/configuracion",
      component: "configuracion",
      key: "configuracion",
      icon: FaCog
    });

    const logoutSubmenu = new Nodo({
      title: "Cerrar sesión",
      path: "#",
      component: "logout",
      key: "logout",
      icon: FaSignOutAlt
    });

    userMenu.agregarHijo(perfilSubmenu);
    userMenu.agregarHijo(configuracionSubmenu);
    userMenu.agregarHijo(logoutSubmenu);

    this.root.agregarHijo(dashboardMenu);
    this.root.agregarHijo(restaurantesMenu);
    this.root.agregarHijo(nuevoRestauranteMenu);
    this.root.agregarHijo(pedidosMenu);
    this.root.agregarHijo(estadisticasMenu);
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

  findMenuByPath(path) {
    function dfsSearch(nodo) {
      if (!nodo) return null;
      
      if (nodo.valor.path === path) {
        return nodo;
      }
      
      for (let hijo of nodo.hijos) {
        const resultado = dfsSearch(hijo);
        if (resultado) return resultado;
      }
      
      return null;
    }
    
    return dfsSearch(this.root);
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

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const [userImageUrl, setUserImageUrl] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [userLoaded, setUserLoaded] = useState(false);

  const [menuTree] = useState(new AdminMenuTree());
  const [navigationMenus, setNavigationMenus] = useState([]);
  const [userSubmenus, setUserSubmenus] = useState([]);

  useEffect(() => {

    const mainMenus = menuTree.bfs();
    setNavigationMenus(mainMenus);
    

    const userSubs = menuTree.getUserSubmenus();
    setUserSubmenus(userSubs);
  }, [menuTree]);

  useEffect(() => {
    if (user) {
      setUserLoaded(true);
      
      if (user.imageUrl && user.imageUrl.trim() !== '' && 
          user.imageUrl !== 'undefined' && user.imageUrl !== 'null') {
        setUserImageUrl(user.imageUrl);
        setImageError(false);
      } else {
        setUserImageUrl(null);
      }
    }
  }, [user]);

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
  

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const isActiveAdvanced = (path, exactMatch = false) => {
    if (exactMatch) {
      return location.pathname === path;
    }
  
    if (path === '/admin' && 
        !location.pathname.startsWith('/admin/restaurantes/nuevo') && 
        !location.pathname.startsWith('/admin/productos')) {
      return location.pathname === '/admin';
    }
    
    if (path === '/admin/restaurantes' && 
        !location.pathname.startsWith('/admin/restaurantes/nuevo')) {
      return location.pathname.startsWith('/admin/restaurantes');
    }
    
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
          navigate(menuData.path);
          break;
        default:
          if (menuData.path && menuData.path !== '#') {
            closeMenu();
            navigate(menuData.path);
          }
          break;
      }
    }
  };
  
  // Manejar cierre de sesión
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

  const handleUserInfoClick = (e) => {
    e.preventDefault();
    handleMenuAction('perfil');
  };

  const handleImageError = (e) => {
    console.log('Error cargando imagen de perfil:', e);
    setImageError(true);
    setUserImageUrl(null);
    e.target.style.display = 'none';
  };
  
  const handleImageLoad = () => {
    setImageError(false);
  };

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

  const shouldShowImage = () => {
    return userLoaded && 
           userImageUrl && 
           !imageError && 
           userImageUrl !== 'undefined' && 
           userImageUrl !== 'null' && 
           userImageUrl.trim() !== '';
  };

  const renderNavigationMenus = () => {
    return navigationMenus.map((menuNode) => {
      const menuData = menuNode.valor;
      const IconComponent = menuData.icon;
      
      return (
        <Link 
          key={menuData.key}
          to={menuData.path} 
          className={isActiveAdvanced(menuData.path, menuData.exactMatch) ? 'active' : ''}
          onClick={closeMenu}
        >
          <IconComponent />
          <span>{menuData.title}</span>
        </Link>
      );
    });
  };

  const renderUserSubmenus = () => {
    return userSubmenus.map((submenuNode) => {
      const submenuData = submenuNode.valor;
      
      if (submenuData.key === 'logout') {
        return (
          <button 
            key={submenuData.key}
            className="logout-button" 
            onClick={() => handleMenuAction(submenuData.key)}
            type="button"
            aria-label="Cerrar sesión"
          >
            <FaSignOutAlt />
            <span>Cerrar sesión</span>
          </button>
        );
      }
      
      return null; 
    });
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
              {renderNavigationMenus()}
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
              
              {renderUserSubmenus()}
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