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
          // Verificar token llamando al endpoint /me
          const response = await api.get('/auth/me');
          
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
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
    
    // Token ya debe estar guardado en localStorage o sessionStorage
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isAuthenticated, 
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};