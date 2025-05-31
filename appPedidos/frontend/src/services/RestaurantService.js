import { api } from './api';

const RestaurantService = {
  
  getRestaurants: async () => {
    try {
      const response = await api.get('/restaurantes');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al obtener restaurantes:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener restaurantes',
        error
      };
    }
  },
  
  
  getMyRestaurants: async () => {
    try {
      const response = await api.get('/restaurantes/mine');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al obtener mis restaurantes:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener tus restaurantes',
        error
      };
    }
  },
  
  
  getRestaurantById: async (id) => {
    try {
      const response = await api.get(`/restaurantes/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al obtener restaurante con ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener el restaurante',
        error
      };
    }
  },
  
  
  createRestaurant: async (restaurantData) => {
    try {
      const response = await api.post('/restaurantes/crear', restaurantData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al crear restaurante:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear el restaurante',
        error
      };
    }
  },
  
  
  updateRestaurant: async (id, restaurantData) => {
    try {
      const response = await api.put(`/restaurantes/editar/${id}`, restaurantData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al actualizar restaurante con ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar el restaurante',
        error
      };
    }
  },
  
  
  deleteRestaurant: async (id) => {
    try {
      const response = await api.delete(`/restaurantes/eliminar/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al eliminar restaurante con ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar el restaurante',
        error
      };
    }
  },
  
  
  getProductsByRestaurant: async (restaurantId) => {
    try {
      const response = await api.get(`/restaurantes/${restaurantId}/productos`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al obtener productos del restaurante ${restaurantId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener productos del restaurante',
        error
      };
    }
  },
  
  
  updateRestaurantImage: async (id, imageUrl) => {
    try {
      const response = await api.put(`/restaurantes/${id}/imagen`, { imageUrl });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al actualizar imagen del restaurante ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar la imagen del restaurante',
        error
      };
    }
  },

  
  getOrdersByRestaurant: async (restaurantId, filters = {}) => {
    try {
      const response = await api.get(`/pedidos/restaurante/${restaurantId}`, {
        params: filters
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al obtener pedidos del restaurante ${restaurantId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener pedidos del restaurante',
        error
      };
    }
  },

  
  getPendingOrdersByRestaurant: async (restaurantId) => {
    try {
      const response = await api.get(`/pedidos/restaurante/${restaurantId}/pendientes`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al obtener pedidos pendientes del restaurante ${restaurantId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener pedidos pendientes',
        error
      };
    }
  },

  
  acceptOrder: async (orderId) => {
    try {
      const response = await api.put(`/pedidos/aceptar/${orderId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al aceptar pedido ${orderId}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al aceptar el pedido',
        error
      };
    }
  },

  
  rejectOrder: async (orderId, motivo) => {
    try {
      const response = await api.put(`/pedidos/rechazar/${orderId}`, { motivo });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al rechazar pedido ${orderId}:`, error);
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
        message: error.response?.data?.message || 'Error al marcar el pedido como preparado',
        error
      };
    }
  }
};

export default RestaurantService;