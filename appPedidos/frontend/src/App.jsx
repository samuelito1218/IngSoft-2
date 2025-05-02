// App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'; 
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

// Componentes de autenticación
import Login from './pages/Login';
import Register from './components/Register';
import RecoverPassword from './components/RecoverPassword';
import ResetPassword from './components/ResetPassword';

// Componentes de Cliente
import ClientHome from './components/client/ClientHome';
import RestaurantDetails from './components/client/RestaurantDetails';
import ProductDetails from './components/client/ProductDetails';
import Cart from './components/client/Cart';
import OrderHistory from './components/client/OrderHistory';
import DeliveryTracking from './components/client/DeliveryTracking';

// Componentes de Restaurante
import RestaurantDashboard from './components/restaurant/RestaurantDashboard';
import OrderManagement from './components/restaurant/OrderManagement';

// Componentes de Repartidor
import DeliveryDashboard from './components/delivery/DeliveryDashboard';
import ActiveOrders from './components/delivery/ActiveOrders';
import DeliveryNavigation from './components/delivery/DeliveryNavigation';

// Layout components
import ClientLayout from './components/layouts/ClientLayout';
import RestaurantLayout from './components/layouts/RestaurantLayout';
import DeliveryLayout from './components/layouts/DeliveryLayout';

// Shared components
import ChatComponent from './components/shared/ChatComponent';
import MapComponent from './components/shared/MapComponent';

// ChatIcon component (new)
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

// Floating Chat component (new)
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
    } else if (user.rol === 'Restaurante' || user.rol === 'restaurante') {
      return <Navigate to="/restaurante" />;
    } else if (user.rol === 'Repartidor' || user.rol === 'repartidor') {
      return <Navigate to="/repartidor" />;
    } else {
      return <Navigate to="/" />;
    }
  }
  
  return children;
};

// El componente principal App
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
          // Buscar pedido activo según el rol
          let endpoint = '';
          
          if (user.rol === 'Cliente' || user.rol === 'cliente') {
            endpoint = '/pedidos/cliente/activo';
          } else if (user.rol === 'Repartidor' || user.rol === 'repartidor') {
            endpoint = '/pedidos/repartidor/activo';
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
                } else if (user.rol === 'Repartidor' || user.rol === 'repartidor') {
                  setChatInfo({
                    pedidoId: data.pedido.id,
                    receptorId: data.pedido.usuario_id,
                    receptorNombre: data.cliente?.nombreCompleto || "Cliente"
                  });
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
      const checkUnreadMessages = () => {
        // Implementar lógica para verificar mensajes no leídos
        // Esto podría hacerse con Firebase o con una llamada a la API
        // Por ahora lo simularemos
        
        if (activePedido && chatInfo.pedidoId) {
          // Simulación de mensaje no leído
          // En la implementación real, esto se haría con Firebase
          setTimeout(() => {
            setHasUnreadMessages(Math.random() > 0.7);
          }, 10000);
        }
      };
      
      const interval = setInterval(checkUnreadMessages, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user, location.pathname]);

  // Ocultar el chat en ciertas rutas
  useEffect(() => {
    if (
      location.pathname.includes('/delivery-tracking') ||
      location.pathname.includes('/repartidor/pedidos-activos/')
    ) {
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
        
        {/* Rutas Restaurante */}
        <Route 
          path="/restaurante" 
          element={
            <ProtectedRoute allowedRoles={['Restaurante', 'restaurante']}>
              <RestaurantLayout>
                <RestaurantDashboard />
              </RestaurantLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/restaurante/pedidos" 
          element={
            <ProtectedRoute allowedRoles={['Restaurante', 'restaurante']}>
              <RestaurantLayout>
                <OrderManagement />
              </RestaurantLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Rutas Repartidor */}
        <Route 
          path="/repartidor" 
          element={
            <ProtectedRoute allowedRoles={['Repartidor', 'repartidor']}>
              <DeliveryLayout>
                <DeliveryDashboard />
              </DeliveryLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/repartidor/pedidos-activos" 
          element={
            <ProtectedRoute allowedRoles={['Repartidor', 'repartidor']}>
              <DeliveryLayout>
                <ActiveOrders />
              </DeliveryLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/repartidor/pedidos-activos/:pedidoId" 
          element={
            <ProtectedRoute allowedRoles={['Repartidor', 'repartidor']}>
              <DeliveryLayout>
                <DeliveryNavigation />
              </DeliveryLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Ruta para redireccionar rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      {/* Floating Chat Icon - Only show for authenticated users with active chat */}
      {isAuthenticated && 
       user && 
       chatInfo.pedidoId && 
       chatInfo.receptorId && 
       !location.pathname.includes('/delivery-tracking') && 
       !location.pathname.includes('/repartidor/pedidos-activos/') && (
        <ChatIcon 
          onClick={toggleChat} 
          hasUnreadMessages={hasUnreadMessages} 
        />
      )}
      
      {/* Floating Chat Window */}
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
      <AppContent />
    </AuthProvider>
  );
}

export default App;