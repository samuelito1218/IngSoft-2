// src/services/api.js - Servicio mejorado
import axios from 'axios';

// Función para obtener el token del almacenamiento
const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

// Crear instancia de axios con URL base
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // URL de tu API
  timeout: 10000, // Timeout de 10 segundos
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use(config => {
  const token = getToken(); // Obtener token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  console.error("Error en el interceptor de solicitud:", error);
  return Promise.reject(error);
});

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Manejar error de conexión
    if (error.code === 'ERR_NETWORK') {
      console.error('Error de conexión al servidor. Verifica que el backend esté corriendo.');
    }

    // Manejar error de autenticación (token expirado o inválido)
    if (error.response && error.response.status === 401) {
      console.error('Error de autenticación 401. Limpiando tokens y redirigiendo...');
      
      // Limpiar tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];

      // Redireccionar a login si no estamos ya en login
      if (window.location.pathname !== '/' && 
          window.location.pathname !== '/register' &&
          !window.location.pathname.startsWith('/reset-password') &&
          window.location.pathname !== '/recover-password') {
        window.location.href = '/';
      }
    }
    
    // Si la respuesta tiene error, loggear más detalles para ayudar a debuggear
    if (error.response) {
      console.error(`Error ${error.response.status} en ${error.config?.url || 'unknown URL'}:`, 
                    error.response.data);
    } else {
      console.error('Error desconocido en la respuesta:', error);
    }
    
    return Promise.reject(error);
  }
);

export default api;