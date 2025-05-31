import { api } from './api';

const ProductService = {
  
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
  },
  
  
  uploadProductImage: async (id, file) => {
    try {
      // Subir imagen a Cloudinary (usando CloudinaryService)
      const CloudinaryService = (await import('../services/CloudinaryService')).default;
      const imageUrl = await CloudinaryService.uploadImage(file, 'productos');
      
      const response = await api.put(`/productos/${id}`, {
        imagen: imageUrl
      });
      
      return {
        success: true,
        data: {
          imageUrl,
          producto: response.data
        }
      };
    } catch (error) {
      console.error(`Error al subir imagen para producto ${id}:`, error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al subir imagen del producto',
        error
      };
    }
  }
};

export default ProductService;