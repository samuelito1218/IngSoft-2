// src/contexts/AuthContext.jsx - Implementación adaptada a tu backend actual
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // API base URL
  const API_URL = 'http://localhost:5000/api';
  
  // Verificar token al cargar
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      console.log('Token encontrado, verificando autenticación...');
      
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 200) {
          const data = await response.json();
          console.log('Verificación exitosa, datos del usuario:', data.user);
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          // Token inválido o expirado
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Error de verificación:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    verifyToken();
  }, []);
  
  // Iniciar sesión
  const login = async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (response.status === 200) {
        const { token, user } = data;
        localStorage.setItem('token', token);
        setUser(user);
        setIsAuthenticated(true);
        return { success: true, user, token }; // Añadir token aquí
      } else {
        return { 
          success: false, 
          message: data.message || 'Error al iniciar sesión' 
        };
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      return { 
        success: false, 
        message: 'Error al conectar con el servidor' 
      };
    }
  };
  
  // Cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };
  
  // Registro de usuario
  const register = async (userData) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (response.status === 201) {
        const { token, user } = data;
        localStorage.setItem('token', token);
        setUser(user);
        setIsAuthenticated(true);
        return { success: true, user };
      } else {
        return { 
          success: false, 
          message: data.message || 'Error al registrarse' 
        };
      }
    } catch (error) {
      console.error('Error de registro:', error);
      return { 
        success: false, 
        message: 'Error al conectar con el servidor' 
      };
    }
  };
  
  // Solicitar recuperación de contraseña
  const requestPasswordReset = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      return { 
        success: response.status === 200,
        message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña'
      };
    } catch (error) {
      console.error('Error al solicitar recuperación de contraseña:', error);
      return {
        success: false,
        message: 'Error al conectar con el servidor'
      };
    }
  };
  
  // Resetear contraseña
  const resetPassword = async (token, newPassword) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
      });
      
      const data = await response.json();
      
      return {
        success: response.status === 200,
        message: data.message || 'Contraseña actualizada correctamente'
      };
    } catch (error) {
      console.error('Error al resetear contraseña:', error);
      return {
        success: false,
        message: 'Error al conectar con el servidor'
      };
    }
  };
  
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    requestPasswordReset,
    resetPassword
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};