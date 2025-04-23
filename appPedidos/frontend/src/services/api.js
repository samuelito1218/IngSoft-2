import axios from 'axios';

// Crear instancia de axios con URL base
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Cambia esto a la URL de tu API
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
    // Manejar error de autenticación (token expirado o inválido)
    if (error.response && error.response.status === 401) {
      // Limpiar tokens
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Redireccionar a login si no estamos ya en login
      if (window.location.pathname !== '/' && window.location.pathname !== '/register') {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;