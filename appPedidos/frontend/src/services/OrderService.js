import api from './api';

const OrderService = {
  
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
  
  
  getActiveOrder: async () => {
    try {
      const response = await api.get('/pedidos/cliente/activo');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      if (error.response && error.response.status === 404) {
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
  },

// Obtener pedidos pendientes para un restaurante
getPendingOrdersByRestaurant: async (restaurantId) => {
  try {
    const response = await api.get(`/pedidos/restaurante/${restaurantId}/pendientes`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`Error al obtener pedidos pendientes para restaurante ${restaurantId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error al obtener pedidos pendientes',
      error
    };
  }
},

// Obtener todos los pedidos para un restaurante
getOrdersByRestaurant: async (restaurantId, params = {}) => {
  try {
    const response = await api.get(`/pedidos/restaurante/${restaurantId}`, { params });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`Error al obtener pedidos para restaurante ${restaurantId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error al obtener pedidos',
      error
    };
  }
},

// Aceptar un pedido
acceptOrder: async (orderId) => {
  try {
    const response = await api.put(`/pedidos/aceptar/${orderId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`Error al aceptar pedido con ID ${orderId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error al aceptar el pedido',
      error
    };
  }
},

// Rechazar un pedido
rejectOrder: async (orderId, reason = '') => {
  try {
    const response = await api.put(`/pedidos/rechazar/${orderId}`, { motivo: reason });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`Error al rechazar pedido con ID ${orderId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error al rechazar el pedido',
      error
    };
  }
},

markOrderAsReady: async (orderId) => {
  try {
    const response = await api.put(`/pedidos/preparado/${orderId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`Error al marcar pedido ${orderId} como preparado:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error al marcar pedido como preparado',
      error
    };
  }
},

// Obtener estadísticas de pedidos
getOrderStats: async (restaurantId, params = {}) => {
  try {
    const response = await api.get(`/pedidos/restaurante/${restaurantId}/estadisticas`, { params });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`Error al obtener estadísticas para restaurante ${restaurantId}:`, error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error al obtener estadísticas',
      error
    };
  }
}
};

export default OrderService;