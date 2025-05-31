

import axios from 'axios';
import MisRestaurantes from '../components/admin/MisRestaurantes';

const API_URL = 'http://localhost:5000/api'; 

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.log(`Error ${error.response.status} en ${error.config.url}:`, error.response.data);
    } else if (error.request) {
      console.log(`Error de conexión en ${error.config.url}`);
    } else {
      console.log('Error desconocido:', error.message);
    }
    return Promise.reject(error);
  }
);

const ApiService = {
  // Autenticación
   auth: {
    login: (email, password) => apiClient.post('/auth/login', { email, password }),
    register: (userData) => apiClient.post('/auth/register', userData),
    requestPasswordReset: (email) => apiClient.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => apiClient.post('/auth/reset-password', { token, password }),
    verifyToken: () => apiClient.get('/auth/verify'),
    validateCedula: (cedula) => apiClient.get(`/auth/validate/cedula/${cedula}`),
    validateTelefono: (telefono) => apiClient.get(`/auth/validate/telefono/${telefono}`),
    forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
    resetPasswordForgot: (token, password) => apiClient.post('/auth/reset-password-forgot', { token, newPassword: password }),
  },
  
  
 // Usuarios
  usuarios: {
    perfil: () => apiClient.get('/usuarios/perfil'),
    actualizar: (userData) => apiClient.put('/usuarios/perfil', userData),
    actualizarImagen: (imageData) => apiClient.post('/usuarios/perfil/imagen', imageData),
    cambiarContrasena: (passwordData) => apiClient.post('/usuarios/perfil/cambiar-contrasena', passwordData),
    obtenerUsuario: (userId) => apiClient.get(`/usuarios/${userId}`),
     eliminarCuenta: () => apiClient.delete('/usuarios/eliminar-cuenta'),
    //obtenerDirecciones: () => apiClient.get('/usuarios/mis-direcciones'),
    //guardarDireccion: (direccionData) => apiClient.post('/usuarios/guardar-direccion', direccionData),
  },
  
  
  direcciones: {
    listar: () => apiClient.get('/api/direcciones'),
    guardar: (data) => apiClient.post('/api/direcciones', data)
  },
  
  // Restaurantes
  restaurantes: {
    listar: () => apiClient.get('/admin/restaurantes'),
    miRestaurantes: ()=> apiClient.get("/mis-restaurantes"),
    listar: () => apiClient.get('/restaurantes'),
    detalle: (id) => apiClient.get(`/restaurantes/${id}`),
    productos: (id) => apiClient.get(`/restaurantes/${id}/productos`),
    crear: (data) => apiClient.post('/restaurantes', data),
    actualizar: (id, data) => apiClient.put(`/restaurantes/${id}`, data),
    eliminar: (id) => apiClient.delete(`/restaurantes/${id}`),
    solicitudVerificacion: (formData) => apiClient.post('/restaurantes/verificacion', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  
  // Productos
  productos: {
    listar: () => apiClient.get('/productos'),
    detalle: (id) => apiClient.get(`/productos/${id}`),
    porRestaurante: (restauranteId) => apiClient.get(`/productos/restaurante/${restauranteId}`),
    crear: (data) => apiClient.post('/productos', data),
    actualizar: (id, data) => apiClient.put(`/productos/${id}`, data),
    eliminar: (id) => apiClient.delete(`/productos/${id}`)
  },
  
  // Pedidos
  pedidos: {
    crear: (data) => apiClient.post('/pedidos/crear', data),
    listar: () => apiClient.get('/historial'),
    detalle: (id) => {
      if (!id) {
        return Promise.reject(new Error('ID de pedido no especificado'));
      }
      return apiClient.get(`/pedidos/${id}`);
    },
    tomarPedido: (pedidoId) => apiClient.put(`/api/pedidos/asignar/${pedidoId}`),
    aceptar: (pedidoId) => apiClient.put(`/pedidos/${pedidoId}/aceptar`),
    rechazar: (pedidoId, motivo) => apiClient.put(`/pedidos/${pedidoId}/rechazar`, { motivo }),
    marcarListo: (pedidoId) => apiClient.put(`/pedidos/${pedidoId}/listo`),
    cambiarEstado: (pedidoId, estado) => apiClient.put(`/pedidos/${pedidoId}/estado`, { estado }),
    calificar: (pedidoId, data) => apiClient.post(`/calificaciones/calificar/${pedidoId}`, data),
    historial: () => apiClient.get('/pedidos/cliente'),
    activo: () => apiClient.get('/pedidos/cliente/activo'),


    disponibles: () => apiClient.get('/pedidos/disponibles'),
  repartidorActivos: () => apiClient.get('/pedidos/repartidor/activos'), 
  tomarPedido: (pedidoId) => apiClient.put(`/pedidos/asignar/${pedidoId}`),
  repartidorHistorial: () => apiClient.get('/pedidos/repartidor/historial'),
  actualizarEstado: (pedidoId, estado) => {
  if (estado === 'EN_CAMINO') {
    return apiClient.put(`/pedidos/en-camino/${pedidoId}`);
  } else if (estado === 'ENTREGADO') {
    return apiClient.put(`/pedidos/entregar/${pedidoId}`);
  } else {
    throw new Error(`Estado no soportado: ${estado}`);
  }}
  },
  
  // Ubicación
  ubicacion: {
    obtener: (pedidoId) => apiClient.get(`/ubicacion/pedido/${pedidoId}`),
    actualizar: (pedidoId, latitud, longitud, heading = 0) => apiClient.put(`/ubicacion/pedido/${pedidoId}`, {
      latitud,
      longitud,
      heading
    })
  },
  
  // Mensajes
  mensajes: {
    obtener: (pedidoId) => apiClient.get(`/mensajes/${pedidoId}`),
    enviar: (pedidoId, receptorId, texto) => apiClient.post(`/mensajes/enviar/${pedidoId}`, {
      usuarioReceptorId: receptorId,
      texto
    }),
    marcarLeido: (mensajeId) => apiClient.put(`/mensajes/marcar-leido/${mensajeId}`)
  },
  
  // Pagos
  pagos: {
    crear: (pedidoId, data) => apiClient.post(`/pagos/pedido/${pedidoId}`, data),
    detalle: (pagoId) => apiClient.get(`/pagos/${pagoId}`),
    solicitudReembolso: (pagoId, motivo) => apiClient.post(`/pagos/${pagoId}/reembolso`, { motivo }),
    crearIntencion: (pedidoId) => apiClient.post(`/pagos/intencion/${pedidoId}`)
  }
};

export default ApiService;

export { apiClient as api };