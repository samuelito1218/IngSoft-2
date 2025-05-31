import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaHome, FaShoppingCart, FaHistory,
  FaUser, FaSignOutAlt, FaBars, FaTimes
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { CartContext } from '../../contexts/CartContext';
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

class ClientMenuTree {
  constructor() {
    this.root = null;
    this.initializeTree();
  }

  initializeTree() {
    this.root = new Nodo({
      title: "Cliente Menu Principal",
      link: "/cliente",
      component: "root",
      key: "root",
      icon: null
    });

    const homeMenu = new Nodo({
      title: "Inicio",
      link: "/cliente",
      component: "home",
      key: "home",
      icon: FaHome
    });

    const pedidosMenu = new Nodo({
      title: "Mis Pedidos",
      link: "/cliente/pedidos",
      component: "pedidos",
      key: "pedidos",
      icon: FaHistory
    });

    const carritoMenu = new Nodo({
      title: "Carrito",
      link: "/cliente/carrito",
      component: "carrito",
      key: "carrito",
      icon: FaShoppingCart,
      hasCounter: true
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
      link: "/cliente/perfil",
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
    this.root.agregarHijo(pedidosMenu);
    this.root.agregarHijo(carritoMenu);
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

const ClientLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
 
  const { totalItems, getCartInfo } = useContext(CartContext);
 
  const [menuTree] = useState(new ClientMenuTree());
  const [navigationMenus, setNavigationMenus] = useState([]);
  const [userSubmenus, setUserSubmenus] = useState([]);
 
  useEffect(() => {
    const navMenus = menuTree.bfs();
    setNavigationMenus(navMenus);
   
    const userSubs = menuTree.getUserSubmenus();
    setUserSubmenus(userSubs);
  }, [menuTree]);
 
  useEffect(() => {
    if (getCartInfo) {
      const cartInfo = getCartInfo();
    }
  }, [totalItems, getCartInfo]);
 
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
    return 'U';
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
          <div className={menuData.hasCounter ? "cart-icon-container" : ""}>
            <IconComponent />
            {menuData.hasCounter && totalItems > 0 && (
              <span className="cart-badge">{totalItems}</span>
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
            <Link to="/cliente">
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