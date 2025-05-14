// src/services/ProductService.js
import api from './api';

const ProductService = {
  // Obtener todos los productos
  getAllProducts: async () => {
    try {
      const response = await api.get('/productos');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al obtener productos:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener productos',
        error
      };
    }
  },
  
  // Obtener un producto por su ID
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
  
  // Obtener productos por restaurante
  getProductsByRestaurant: async (restaurantId) => {
    try {
      const response = await api.get(`/productos/restaurante/${restaurantId}`);
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
  
  // Crear un nuevo producto
  createProduct: async (productData) => {
    try {
      const response = await api.post('/productos', productData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al crear producto:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al crear el producto',
        error
      };
    }
  },
  
  // Actualizar un producto existente
  updateProduct: async (id, productData) => {
    try {
      const response = await api.put(`/productos/${id}`, productData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al actualizar producto con ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al actualizar el producto',
        error
      };
    }
  },
  
  // Eliminar un producto
  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/productos/${id}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error al eliminar producto con ID ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al eliminar el producto',
        error
      };
    }
  }
};

export default ProductService;