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
          console.log("Token encontrado, verificando autenticación...");
          
          // Configurar el token para esta petición específica
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verificar token llamando al endpoint /me
          const response = await api.get('/auth/me');
          console.log("Verificación exitosa, datos del usuario:", response.data.user);
          
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
          // Si hay error, limpiar tokens
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log("No hay token almacenado");
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };
    
    checkAuthStatus();
  }, []);

  // Función para iniciar sesión
  const login = async (userData, token) => {
    console.log("login() llamado con:", userData);
    
    if (!userData || !userData.rol) {
      console.error("Datos de usuario incompletos:", userData);
      return false;
    }
    
    try {
      // Guardar el token en localStorage o sessionStorage
      localStorage.setItem('token', token);
      
      // Configurar el token para futuras peticiones
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log("Usuario autenticado correctamente:", userData);
      return true;
    } catch (error) {
      console.error("Error en la función login:", error);
      return false;
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    console.log("logout() llamado");
    
    // Eliminar el token
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    
    // Eliminar el token de los headers
    delete api.defaults.headers.common['Authorization'];
    
    // Actualizar el estado
    setUser(null);
    setIsAuthenticated(false);
    
    console.log("Sesión cerrada correctamente");
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