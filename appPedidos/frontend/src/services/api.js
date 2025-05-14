// src/services/api.js
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

// Exportar los métodos del servicio API
const ApiService = {
  // Métodos de autenticación
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    recoverPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, newPassword) => api.post('/auth/reset-password', { token, newPassword }),
    verify: () => api.get('/auth/me')
  },

  usuarios: {
    direcciones: () => api.get('/usuarios/direcciones'),
    guardarDireccion: (data) => api.post('/usuarios/direcciones', data),
    perfil: () => api.get('/usuarios/perfil'),
    // Nuevo método para obtener un usuario por ID
    obtenerUsuario: (id) => api.get(`/usuarios/${id}`),
    actualizarPerfil: (data) => api.put('/usuarios/perfil', data),
    actualizarImagen: (data) => api.put('/usuarios/perfil/imagen', data)
  },
  // Métodos para pedidos
  pedidos: {
    crear: (pedidoData) => api.post('/pedidos/crear', pedidoData),
    activo: () => api.get('/pedidos/cliente/activo'),
    historial: () => api.get('/pedidos/cliente'),
    detalle: (id) => api.get(`/pedidos/${id}`),
    cancelar: (id) => api.delete(`/pedidos/eliminar/${id}`),
    editar: (id, data) => api.put(`/pedidos/editar/${id}`, data),
    calificar: (id, data) => api.post(`/calificaciones/calificar/${id}`, data)
  },
  
  // Métodos para restaurantes y productos
  restaurantes: {
    listar: () => api.get('/restaurantes'),
    buscar: (query) => api.get(`/restaurantes?search=${query}`),
    detalle: (id) => api.get(`/restaurantes/${id}`),
    productos: (restauranteId) => api.get(`/restaurantes/${restauranteId}/productos`),
    verificar: (id) => api.get(`/restaurantes/verificacion/${id}`)
  },
  
  // Métodos para mensajes
  mensajes: {
    enviar: (pedidoId, texto, usuarioReceptorId) => 
      api.post(`/mensajes/enviar/${pedidoId}`, { texto, usuarioReceptorId }),
    obtener: (pedidoId) => api.get(`/mensajes/${pedidoId}`),
    marcarLeido: (mensajeId) => api.put(`/mensajes/marcar-leido/${mensajeId}`)
  },
  
  // Métodos para pagos
  pagos: {
    crearIntencion: (pedidoId) => api.post(`/pagos/${pedidoId}/crear-intencion`),
    confirmar: (paymentIntentId) => api.post('/pagos/confirmar', { paymentIntentId }),
    procesar: (pedidoId, data) => api.post(`/pagos/${pedidoId}/procesar`, data)
  },
  
  // Métodos para ubicación
  ubicacion: {
    actualizar: (pedidoId, latitud, longitud) => 
      api.put(`/ubicacion/pedido/${pedidoId}`, { latitud, longitud }),
    obtener: (pedidoId) => api.get(`/ubicacion/pedido/${pedidoId}`)
  },
  productos: {
    detalle: (id) => api.get(`/productos/${id}`),
    listar: () => api.get('/productos'),
    porRestaurante: (restauranteId) => api.get(`/productos/restaurante/${restauranteId}`)
  }
};


export { api };
export default ApiService;