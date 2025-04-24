// Corrección de src/contexts/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

// Crear contexto
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Verificar si el usuario está autenticado al cargar la aplicación
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (token) {
        try {
          // Configurar el token para esta petición específica
          const config = {
            headers: {
              Authorization: `Bearer ${token}`
            }
          };
          
          // Verificar token llamando al endpoint /me
          const response = await api.get('/auth/me', config);
          
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
          // Si hay error, limpiar tokens
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
        }
      }
      
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  // Función para iniciar sesión
  const login = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);

    // Guardar el token en localStorage o sessionStorage
    localStorage.setItem('token', token); // O sessionStorage dependiendo del caso
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Valor del contexto
  const contextValue = {
    user,
    loading,
    isAuthenticated,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
