// src/services/OrderService.js
import api from './api';

const OrderService = {
  /**
   * Crear un nuevo pedido
   * @param {Object} orderData - Datos del pedido
   * @returns {Promise} - Respuesta con el pedido creado
   */
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/pedidos/crear', orderData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al crear pedido:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear el pedido',
        error
      };
    }
  },
  
  /**
   * Obtener el pedido activo del cliente
   * @returns {Promise} - Pedido activo o null
   */
  getActiveOrder: async () => {
    try {
      const response = await api.get('/pedidos/cliente/activo');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // No hay pedido activo, esto no es un error
        return {
          success: true,
          data: null
        };
      }
      
      console.error('Error al obtener pedido activo:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener pedido activo',
        error
      };
    }
  },
  
  /**
   * Obtener historial de pedidos del cliente
   * @returns {Promise} - Lista de pedidos
   */
  getOrderHistory: async () => {
    try {
      const response = await api.get('/pedidos/cliente');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al obtener historial de pedidos:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener historial de pedidos',
        error
      };
    }
  },
  
  /**
   * Obtener detalle de un pedido
   * @param {string} id - ID del pedido
   * @returns {Promise} - Detalle del pedido
   */
  getOrderById: async (id) => {
    try {
      const response = await api.get(`/pedidos/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al obtener pedido con ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener el pedido',
        error
      };
    }
  },
  
  /**
   * Cancelar un pedido
   * @param {string} id - ID del pedido
   * @returns {Promise} - Respuesta de la API
   */
  cancelOrder: async (id) => {
    try {
      const response = await api.delete(`/pedidos/eliminar/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al cancelar pedido con ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al cancelar el pedido',
        error
      };
    }
  },
  
  /**
   * Calificar un pedido entregado
   * @param {string} id - ID del pedido
   * @param {Object} ratingData - Datos de calificación
   * @returns {Promise} - Respuesta de la API
   */
  rateOrder: async (id, ratingData) => {
    try {
      const response = await api.post(`/calificaciones/calificar/${id}`, ratingData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al calificar pedido con ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al calificar el pedido',
        error
      };
    }
  },
  
  /**
   * Procesar pago de un pedido
   * @param {string} orderId - ID del pedido
   * @param {Object} paymentData - Datos del pago
   * @returns {Promise} - Respuesta de la API
   */
  processPayment: async (orderId, paymentData) => {
    try {
      const response = await api.post(`/pagos/${orderId}/procesar`, paymentData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al procesar pago para el pedido ${orderId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al procesar el pago',
        error
      };
    }
  },
  
  /**
   * Obtener ubicación del repartidor para un pedido
   * @param {string} orderId - ID del pedido
   * @returns {Promise} - Ubicación del repartidor
   */
  getDeliveryLocation: async (orderId) => {
    try {
      const response = await api.get(`/ubicacion/pedido/${orderId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al obtener ubicación del repartidor para el pedido ${orderId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener ubicación del repartidor',
        error
      };
    }
  }
};

export default OrderService;