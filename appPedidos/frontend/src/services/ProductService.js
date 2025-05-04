// src/services/ProductService.js
import api from './api';

class ProductService {
  // Obtener un producto por ID
  async getProductById(id) {
    try {
      const response = await api.get(`/productos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener producto con ID ${id}:`, error);
      throw error;
    }
  }

  // Obtener productos populares
  async getPopularProducts() {
    try {
      const response = await api.get('/productos/populares');
      return response.data;
    } catch (error) {
      console.error('Error al obtener productos populares:', error);
      throw error;
    }
  }

  // Buscar productos por término
  async searchProducts(query) {
    try {
      const response = await api.get(`/productos/buscar?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error(`Error al buscar productos con término "${query}":`, error);
      throw error;
    }
  }

  // Obtener productos por categoría
  async getProductsByCategory(categoryId) {
    try {
      const response = await api.get(`/productos/categoria/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener productos de categoría ${categoryId}:`, error);
      throw error;
    }
  }

  // Obtener opciones o adicionales para un producto
  async getProductOptions(productId) {
    try {
      const response = await api.get(`/productos/${productId}/opciones`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener opciones para producto ${productId}:`, error);
      
      // Devolver opciones de ejemplo como fallback
      return [
        { id: '1', name: 'Queso extra', price: 2000 },
        { id: '2', name: 'Tocineta', price: 3000 },
        { id: '3', name: 'Huevo frito', price: 2500 },
        { id: '4', name: 'Guacamole', price: 2800 }
      ];
    }
  }
}

export default new ProductService();