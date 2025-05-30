import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaHome, FaShoppingCart, FaHistory, 
  FaUser, FaSignOutAlt, FaBars, FaTimes 
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import './layouts.css';

// Implementación de N-ary Tree según las diapositivas
class Nodo {
  constructor(valor) {
    this.valor = valor;
    this.hijos = [];
  }

  agregarHijo(nodo) {
    this.hijos.push(nodo);
  }
}

// Clase para manejar el árbol de menús del cliente
class ClientMenuTree {
  constructor() {
    this.root = null;
    this.initializeTree();
  }

  initializeTree() {
    // Crear el árbol de menús del cliente
    this.root = new Nodo({
      title: "Cliente Menu Principal",
      link: "/cliente",
      component: "root",
      key: "root",
      icon: null
    });

    // Menús principales de navegación
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

    // Menú de usuario con submenús
    const userMenu = new Nodo({
      title: "Usuario",
      link: "#",
      component: "user",
      key: "user",
      icon: FaUser
    });

    // Submenús del usuario
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

    // Agregar submenús al menú de usuario
    userMenu.agregarHijo(perfilSubmenu);
    userMenu.agregarHijo(logoutSubmenu);

    // Agregar menús principales al root
    this.root.agregarHijo(homeMenu);
    this.root.agregarHijo(pedidosMenu);
    this.root.agregarHijo(carritoMenu);
    this.root.agregarHijo(userMenu);
  }

  // DFS para buscar un nodo por key
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

  // BFS para obtener menús principales de navegación
  bfs() {
    if (!this.root) return [];
    
    const cola = [this.root];
    const resultado = [];
    
    while (cola.length > 0) {
      const actual = cola.shift();
      
      // Solo agregar los hijos del root que son menús de navegación
      if (actual === this.root) {
        for (let hijo of actual.hijos) {
          if (hijo.valor.key !== 'user') { // Excluir user del menú de navegación
            resultado.push(hijo);
          }
        }
      }
    }
    
    return resultado;
  }

  // Obtener submenús de usuario
  getUserSubmenus() {
    const userNode = this.dfs(this.root, 'user');
    return userNode ? userNode.hijos : [];
  }

  // Buscar menú por key
  findMenu(key) {
    return this.dfs(this.root, key);
  }

  // Obtener todos los menús (incluyendo submenús) usando DFS
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
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  // Inicializar el árbol de menús
  const [menuTree] = useState(new ClientMenuTree());
  const [navigationMenus, setNavigationMenus] = useState([]);
  const [userSubmenus, setUserSubmenus] = useState([]);
  
  // Inicializar los menús usando BFS al montar el componente
  useEffect(() => {
    // Usar BFS para obtener menús de navegación principales
    const navMenus = menuTree.bfs();
    setNavigationMenus(navMenus);
    
    // Obtener submenús de usuario
    const userSubs = menuTree.getUserSubmenus();
    setUserSubmenus(userSubs);
  }, [menuTree]);
  
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
  
  // Verificar si una ruta está activa usando el árbol
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Manejar acciones de menú usando el árbol
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

  // Manejar click en perfil usando el árbol
  const handleUserInfoClick = (e) => {
    e.preventDefault();
    handleMenuAction('perfil');
  };

  // Función para renderizar menús de navegación usando el árbol
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
            {menuData.hasCounter && cartItemsCount > 0 && (
              <span className="cart-badge">{cartItemsCount}</span>
            )}
          </div>
          <span>{menuData.title}</span>
        </Link>
      );
    });
  };

  // Función para renderizar submenús de usuario (no se usan en este layout específico)
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