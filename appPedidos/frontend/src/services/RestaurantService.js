// src/services/RestaurantService.js
import api from './api';

const RestaurantService = {
  /**
   * Obtener lista de restaurantes
   * @param {Object} params - Parámetros de búsqueda (opcional)
   * @returns {Promise} - Lista de restaurantes
   */
  getRestaurants: async (params = {}) => {
    try {
      const response = await api.get('/restaurantes', { params });
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
  
  /**
   * Obtener detalle de un restaurante
   * @param {string} id - ID del restaurante
   * @returns {Promise} - Detalle del restaurante
   */
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
  
  /**
   * Buscar restaurantes por nombre
   * @param {string} query - Términos de búsqueda
   * @returns {Promise} - Resultados de la búsqueda
   */
  searchRestaurants: async (query) => {
    try {
      const response = await api.get(`/restaurantes/buscar?q=${encodeURIComponent(query)}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al buscar restaurantes:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al buscar restaurantes',
        error
      };
    }
  },
  
  /**
   * Obtener productos de un restaurante
   * @param {string} restaurantId - ID del restaurante
   * @returns {Promise} - Lista de productos
   */
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
        message: error.response?.data?.message || 'Error al obtener productos',
        error
      };
    }
  },
  
  /**
   * Obtener detalle de un producto
   * @param {string} id - ID del producto
   * @returns {Promise} - Detalle del producto
   */
  getProductById: async (id) => {
    try {
      const response = await api.get(`/productos/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al obtener producto con ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener el producto',
        error
      };
    }
  },
  
  /**
   * Obtener restaurantes por categoría
   * @param {string} category - Categoría
   * @returns {Promise} - Lista de restaurantes
   */
  getRestaurantsByCategory: async (category) => {
    try {
      const response = await api.get(`/restaurantes/categoria/${category}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al obtener restaurantes de la categoría ${category}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener restaurantes por categoría',
        error
      };
    }
  },
  
  /**
   * Obtener categorías disponibles
   * @returns {Promise} - Lista de categorías
   */
  getCategories: async () => {
    try {
      const response = await api.get('/categorias');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      // Si no hay endpoint específico, devolvemos categorías por defecto
      return {
        success: true,
        data: [
          'Hamburguesas',
          'Pizza',
          'Pollo',
          'Mexicana',
          'Vegetariana',
          'Postres',
          'Bebidas'
        ]
      };
    }
  }
};

export default RestaurantService;