// src/services/RestaurantService.js
import api from './api';

class RestaurantService {
  // Obtener todos los restaurantes
  async getAllRestaurants() {
    try {
      const response = await api.get('/restaurantes');
      return response.data;
    } catch (error) {
      console.error('Error al obtener restaurantes:', error);
      throw error;
    }
  }

  // Obtener un restaurante por ID
  async getRestaurantById(id) {
    try {
      const response = await api.get(`/restaurantes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener restaurante con ID ${id}:`, error);
      throw error;
    }
  }

  // Obtener los productos/menú de un restaurante
  async getRestaurantProducts(restaurantId) {
    try {
      const response = await api.get(`/restaurantes/${restaurantId}/productos`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener productos del restaurante ${restaurantId}:`, error);
      throw error;
    }
  }

  // Obtener restaurantes por categoría
  async getRestaurantsByCategory(categoryId) {
    try {
      const response = await api.get(`/restaurantes/categoria/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener restaurantes de categoría ${categoryId}:`, error);
      throw error;
    }
  }

  // Buscar restaurantes por término
  async searchRestaurants(query) {
    try {
      const response = await api.get(`/restaurantes/buscar?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error(`Error al buscar restaurantes con término "${query}":`, error);
      throw error;
    }
  }

  // Obtener categorías de restaurantes
  async getCategories() {
    try {
      const response = await api.get('/categorias');
      return response.data;
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      // Devolver categorías de ejemplo como fallback
      return [
        { id: 1, nombre: 'Hamburguesas' },
        { id: 2, nombre: 'Pizza' },
        { id: 3, nombre: 'Sushi' },
        { id: 4, nombre: 'Postres' },
        { id: 5, nombre: 'Saludable' },
        { id: 6, nombre: 'Bebidas' }
      ];
    }
  }

  // Obtener restaurantes destacados o populares
  async getFeaturedRestaurants() {
    try {
      const response = await api.get('/restaurantes/destacados');
      return response.data;
    } catch (error) {
      console.error('Error al obtener restaurantes destacados:', error);
      throw error;
    }
  }
}

export default new RestaurantService();