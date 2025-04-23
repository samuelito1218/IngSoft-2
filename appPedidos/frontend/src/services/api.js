// Corrección de src/services/api.js

import axios from 'axios';

// Crear instancia de axios con URL base
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // URL de tu API
  timeout: 10000, // Timeout de 10 segundos
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(config => {
  // Obtener token de localStorage o sessionStorage
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  response => response,
  error => {
    // Manejar error de conexión
    if (error.code === 'ERR_NETWORK') {
      console.error('Error de conexión al servidor. Verifica que el backend esté corriendo.');
    }
    
    // Manejar error de autenticación (token expirado o inválido)
    if (error.response && error.response.status === 401) {
      // Limpiar tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Redireccionar a login si no estamos ya en login
      if (window.location.pathname !== '/' && 
          window.location.pathname !== '/register' &&
          !window.location.pathname.startsWith('/reset-password') &&
          window.location.pathname !== '/recover-password') {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;