import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'; 
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { useAuth } from './hooks/useAuth';
import ChatService from './services/ChatService';


// Componentes de autenticación
import Login from './pages/Login';
import Register from './components/Register';
import RecoverPassword from './components/RecoverPassword';
import ResetPassword from './components/ResetPassword';
import Profile from './components/client/Profile';

// Componentes de Cliente
import ClientHome from './components/client/clienthome/ClientHome';
import RestaurantDetails from './components/client/restaurantdetails/RestaurantDetails';
import ProductDetails from './components/client/productdetails/ProductDetails';
import Cart from './pages/Cart/Cart';
import OrderHistory from './components/client/orderhistory/OrderHistory';
import DeliveryTracking from './components/client/deliverytracking/DeliveryTracking';
import Checkout from './components/client/checkout/Checkout';
import RateOrder from './components/client/rateorder/RateOrder';

// Componentes de Admin
import AdminLayout from './components/layouts/AdminLayout';
import AdminDashboard from './components/admin/dashboard/AdminDashboard';
import MisRestaurantes from './components/admin/MisRestaurantes';
import AddRestaurant from './components/admin/AddRestaurant';
import RestaurantDetail from './components/admin/restaurant/RestaurantDetail';
import ProductManagement from './components/admin/productos/ProductManagement';
import AllOrders from './components/admin/Orders/AllOrders';
import Statistics from './components/admin/statistics/Statistics';

// Componentes del Repartidor
import RepartidorLayout from './components/layouts/RepartidorLayout';
import RepartidorDashboard from './components/repartidor/dashboard/RepartidorDashboard';
import PedidosDisponibles from './components/repartidor/PedidosDisponibles';
import PedidosActivos from './components/repartidor/PedidosActivos';
import ChatPedido from './components/repartidor/ChatPedido';
import HistorialPedidos from './components/repartidor/HistorialPedidos';

// Layout components
import ClientLayout from './components/layouts/ClientLayout';

// Shared components
import ChatComponent from './components/shared/ChatComponent';
import MapComponent from './components/shared/LeafletMapComponent';

// ChatIcon component
const ChatIcon = ({ onClick, hasUnreadMessages }) => {
  return (
    <div 
      className={`chat-icon-container ${hasUnreadMessages ? 'has-unread' : ''}`}
      onClick={onClick}
    >
      <span className="chat-icon">💬</span>
      {hasUnreadMessages && <span className="unread-badge"></span>}
    </div>
  );
};

// Floating Chat component
const FloatingChat = ({ pedidoId, receptorId, receptorNombre, onClose }) => {
  if (!pedidoId || !receptorId) return null;
  
  return (
    <div className="floating-chat">
      <div className="floating-chat-header">
        <h3>Chat con {receptorNombre}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="floating-chat-body">
        <ChatComponent 
          pedidoId={pedidoId}
          receptorId={receptorId}
          receptorNombre={receptorNombre}
        />
      </div>
    </div>
  );
};

// Componente para rutas protegidas con verificación de rol
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Cargando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  if (!allowedRoles.includes(user.rol)) {
    // Redirigir según el rol del usuario
    if (user.rol === 'Cliente' || user.rol === 'cliente') {
      return <Navigate to="/cliente" />;
    } else if (user.rol === 'Repartidor' || user.rol === 'repartidor') {
      return <Navigate to="/repartidor" />;
    } else if (user.rol === 'Admin' || user.rol === 'admin') {
      return <Navigate to="/admin" />;
    } else {
      return <Navigate to="/" />;
    }
  }
  
  return children;
};

function AppContent() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [activePedido, setActivePedido] = useState(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInfo, setChatInfo] = useState({
    pedidoId: null,
    receptorId: null,
    receptorNombre: null
  });

  // Cargar pedido activo del usuario
  useEffect(() => {
    if (isAuthenticated && user) {
      const loadActivePedido = async () => {
        try {
          let endpoint = '';
          
          if (user.rol === 'Cliente' || user.rol === 'cliente') {
            endpoint = '/pedidos/cliente/activo';
          }
          
          if (endpoint) {
            const response = await fetch(`http://localhost:5000/api${endpoint}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data && data.pedido) {
                setActivePedido(data.pedido);
                
                // Si hay un pedido activo, configurar el chat
                if (user.rol === 'Cliente' || user.rol === 'cliente') {
                  if (data.pedido.repartidor_Id) {
                    setChatInfo({
                      pedidoId: data.pedido.id,
                      receptorId: data.pedido.repartidor_Id,
                      receptorNombre: data.repartidor?.nombreCompleto || "Repartidor"
                    });
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Error al cargar el pedido activo:", error);
        }
      };
      
      loadActivePedido();
      
      // Verificar mensajes no leídos periódicamente
      const checkUnreadMessages = async () => {
        try {
          if (user) {
            const count = await ChatService.checkUnreadMessages(user.id);
            setHasUnreadMessages(count > 0); 
          }
        } catch (error) {
          console.error('Error al verificar mensajes no leídos:', error);
        }
      };
      
      const interval = setInterval(checkUnreadMessages, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, location.pathname]);

  // Ocultar el chat en ciertas rutas
  useEffect(() => {
    if (location.pathname.includes('/delivery-tracking')) {
      setShowChat(false);
    }
  }, [location.pathname]);

  const toggleChat = () => {
    setShowChat(!showChat);
    if (showChat) {
      setHasUnreadMessages(false);
    }
  };

  return (
    <>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recover-password" element={<RecoverPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Rutas de Administrador */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          {/* Dashboard como página principal */}
          <Route index element={<AdminDashboard />} />
          
          {/* Rutas para administración de restaurantes */}
          <Route path="restaurantes" element={<MisRestaurantes />} />
          <Route path="restaurantes/nuevo" element={<AddRestaurant />} />
          <Route path="restaurantes/editar/:id" element={<AddRestaurant />} />
          <Route path="restaurantes/:restaurantId" element={<RestaurantDetail />} />
          
          {/* Rutas para administración de productos */}
          <Route path="productos/:restauranteId" element={<ProductManagement />} />
          
          {/* Rutas para administración de pedidos */}
          <Route path="pedidos" element={<AllOrders />} />
          
          {/* Rutas para estadísticas */}
          <Route path="estadisticas" element={<Statistics />} />

          
          {/* Ruta para perfil de usuario administrador */}
          <Route path="perfil" element={<Profile />} />
        </Route>

        {/* Rutas Cliente */}
        <Route 
          path="/cliente" 
          element={
            <ProtectedRoute allowedRoles={['Cliente', 'cliente']}>
              <ClientLayout>
                <ClientHome />
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cliente/perfil" element={
          <ProtectedRoute allowedRoles={['Cliente', 'cliente']}>
            <ClientLayout>
              <Profile />
            </ClientLayout>
          </ProtectedRoute>
        } 
        />
        <Route 
          path="/cliente/restaurante/:id" 
          element={
            <ProtectedRoute allowedRoles={['Cliente', 'cliente']}>
              <ClientLayout>
                <RestaurantDetails />
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cliente/producto/:id" 
          element={
            <ProtectedRoute allowedRoles={['Cliente', 'cliente']}>
              <ClientLayout>
                <ProductDetails />
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cliente/carrito" 
          element={
            <ProtectedRoute allowedRoles={['Cliente', 'cliente']}>
              <ClientLayout>
                <Cart />
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cliente/checkout" 
          element={
            <ProtectedRoute allowedRoles={['Cliente', 'cliente']}>
              <ClientLayout>
                <Checkout />
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cliente/pedidos" 
          element={
            <ProtectedRoute allowedRoles={['Cliente', 'cliente']}>
              <ClientLayout>
                <OrderHistory />
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cliente/delivery-tracking/:pedidoId" 
          element={
            <ProtectedRoute allowedRoles={['Cliente', 'cliente']}>
              <ClientLayout>
                <DeliveryTracking />
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cliente/calificar/:pedidoId" 
          element={
            <ProtectedRoute allowedRoles={['Cliente', 'cliente']}>
              <ClientLayout>
                <RateOrder />
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        
        
        {/* Rutas Repartidor */}
        <Route 
          path="/repartidor" 
          element={
            <ProtectedRoute allowedRoles={['Repartidor', 'repartidor']}>
              <RepartidorLayout>
                <RepartidorDashboard />
              </RepartidorLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/repartidor/pedidos-disponibles" 
          element={
            <ProtectedRoute allowedRoles={['Repartidor', 'repartidor']}>
              <RepartidorLayout>
                <PedidosDisponibles />
              </RepartidorLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/repartidor/pedidos-activos" 
          element={
            <ProtectedRoute allowedRoles={['Repartidor', 'repartidor']}>
              <RepartidorLayout>
                <PedidosActivos />
              </RepartidorLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/repartidor/chat/:pedidoId" 
          element={
            <ProtectedRoute allowedRoles={['Repartidor', 'repartidor']}>
              <RepartidorLayout>
                <ChatPedido />
              </RepartidorLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/repartidor/historial" 
          element={
            <ProtectedRoute allowedRoles={['Repartidor', 'repartidor']}>
              <RepartidorLayout>
                <HistorialPedidos />
              </RepartidorLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/repartidor/perfil" 
          element={
            <ProtectedRoute allowedRoles={['Repartidor', 'repartidor']}>
              <RepartidorLayout>
                <Profile />
              </RepartidorLayout>
            </ProtectedRoute>
          } 
        />

        
        {/* Ruta para redireccionar rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      {/* Floating Chat Icon*/}
      {isAuthenticated && 
       user && 
       chatInfo.pedidoId && 
       chatInfo.receptorId && 
       !location.pathname.includes('/delivery-tracking') && (
        <ChatIcon 
          onClick={toggleChat} 
          hasUnreadMessages={hasUnreadMessages} 
        />
      )}
      
      {showChat && chatInfo.pedidoId && (
        <FloatingChat 
          pedidoId={chatInfo.pedidoId}
          receptorId={chatInfo.receptorId}
          receptorNombre={chatInfo.receptorNombre}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;