// Corrección de src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'; 
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';

// Componentes
import Login from './components/Login';
import Register from './components/Register';
import RecoverPassword from './components/RecoverPassword';
import ResetPassword from './components/ResetPassword';

// Componente temporal para dashboard
const Dashboard = () => (
  <div style={{ 
    padding: '20px', 
    textAlign: 'center', 
    backgroundColor: 'white', 
    color: 'black', 
    borderRadius: '10px',
    margin: '20px'
  }}>
    <h1>Dashboard</h1>
    <p>Bienvenido al dashboard de FastFood</p>
  </div>
);

// Componente para rutas protegidas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/" />;
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
        
        {/* Rutas protegidas */}
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        
        {/* Ruta para redireccionar rutas no encontradas */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;