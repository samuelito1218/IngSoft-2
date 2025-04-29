import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; 
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

// Componentes de autenticación
import Login from './pages/Login';
import Register from './components/Register';
import RecoverPassword from './components/RecoverPassword';
import ResetPassword from './components/ResetPassword';

// Componentes de Cliente
//import ClientHome from './components/client/ClientHome';
//import RestaurantDetails from './components/client/RestaurantDetails';
//import ProductDetails from './components/client/ProductDetails';
//import Cart from './components/client/Cart';
//import OrderHistory from './components/client/OrderHistory';

// Componentes de Restaurante
//import RestaurantDashboard from './components/restaurant/RestaurantDashboard';
//import MenuManagement from './components/restaurant/MenuManagement';
//import OrderManagement from './components/restaurant/OrderManagement';

// Componentes de Repartidor
//import DeliveryDashboard from './components/delivery/DeliveryDashboard';
//import ActiveOrders from './components/delivery/ActiveOrders';
//import DeliveryHistory from './components/delivery/DeliveryHistory';

// Layout components
import ClientLayout from './components/layouts/ClientLayout';
import RestaurantLayout from './components/layouts/RestaurantLayout';
import DeliveryLayout from './components/layouts/DeliveryLayout';

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
    if (user.rol === 'Cliente') {
      return <Navigate to="/cliente" />;
    } else if (user.rol === 'Restaurante') {
      return <Navigate to="/restaurante" />;
    } else if (user.rol === 'Repartidor') {
      return <Navigate to="/repartidor" />;
    } else {
      return <Navigate to="/" />;
    }
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
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
            <ProtectedRoute allowedRoles={['Cliente']}>
              <ClientLayout>
                {/*<ClientHome />*/}
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cliente/restaurante/:id" 
          element={
            <ProtectedRoute allowedRoles={['Cliente']}>
              <ClientLayout>
                {/*<RestaurantDetails />*/}
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cliente/producto/:id" 
          element={
            <ProtectedRoute allowedRoles={['Cliente']}>
              <ClientLayout>
                {/*<ProductDetails />*/}
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cliente/carrito" 
          element={
            <ProtectedRoute allowedRoles={['Cliente']}>
              <ClientLayout>
                {/*<Cart />*/}
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/cliente/pedidos" 
          element={
            <ProtectedRoute allowedRoles={['Cliente']}>
              <ClientLayout>
                {/*<OrderHistory />*/}
              </ClientLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Rutas Restaurante */}
        <Route 
          path="/restaurante" 
          element={
            <ProtectedRoute allowedRoles={['Restaurante']}>
              <RestaurantLayout>
                {/*<RestaurantDashboard />*/}
              </RestaurantLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/restaurante/menu" 
          element={
            <ProtectedRoute allowedRoles={['Restaurante']}>
              <RestaurantLayout>
                {/*<MenuManagement />*/}
              </RestaurantLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/restaurante/pedidos" 
          element={
            <ProtectedRoute allowedRoles={['Restaurante']}>
              <RestaurantLayout>
                {/*<OrderManagement />*/}
              </RestaurantLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Rutas Repartidor */}
        <Route 
          path="/repartidor" 
          element={
            <ProtectedRoute allowedRoles={['Repartidor']}>
              <DeliveryLayout>
                {/*<DeliveryDashboard />*/}
              </DeliveryLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/repartidor/pedidos-activos" 
          element={
            <ProtectedRoute allowedRoles={['Repartidor']}>
              <DeliveryLayout>
                {/*<ActiveOrders />*/}
              </DeliveryLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/repartidor/historial" 
          element={
            <ProtectedRoute allowedRoles={['Repartidor']}>
              <DeliveryLayout>
                {/*<DeliveryHistory />*/}
              </DeliveryLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Ruta para redireccionar rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;