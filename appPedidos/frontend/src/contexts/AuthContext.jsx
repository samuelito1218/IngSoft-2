// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
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
        const response = await api.get('/auth/me');
        
        if (response.status === 200) {
          console.log('Verificación exitosa, datos del usuario:', response.data.user);
          setUser(response.data.user);
          setIsAuthenticated(true);
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
      const response = await api.post('/auth/login', credentials);
      
      if (response.status === 200) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al iniciar sesión' 
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
      const response = await api.post('/auth/register', userData);
      
      if (response.status === 201) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (error) {
      console.error('Error de registro:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Error al registrarse' 
      };
    }
  };
  
  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};