// src/services/OrderService.js
import api from './api';

class OrderService {
  // Crear un nuevo pedido
  async createOrder(orderData) {
    try {
      const response = await api.post('/pedidos/crear', orderData);
      return response.data;
    } catch (error) {
      console.error('Error al crear pedido:', error);
      throw error;
    }
  }

  // Obtener los pedidos del cliente actual
  async getClientOrders() {
    try {
      const response = await api.get('/pedidos/cliente');
      return response.data;
    } catch (error) {
      console.error('Error al obtener pedidos del cliente:', error);
      throw error;
    }
  }

  // Obtener un pedido específico por ID
  async getOrderById(id) {
    try {
      const response = await api.get(`/pedidos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener pedido con ID ${id}:`, error);
      throw error;
    }
  }

  // Obtener el pedido activo del cliente (si existe)
  async getActiveOrder() {
    try {
      const response = await api.get('/pedidos/cliente/activo');
      return response.data;
    } catch (error) {
      console.error('Error al obtener pedido activo:', error);
      return null;
    }
  }

  // Cancelar un pedido
  async cancelOrder(id) {
    try {
      const response = await api.delete(`/pedidos/eliminar/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al cancelar pedido con ID ${id}:`, error);
      throw error;
    }
  }

  // Editar un pedido (solo si está en estado Pendiente)
  async editOrder(id, orderData) {
    try {
      const response = await api.put(`/pedidos/editar/${id}`, orderData);
      return response.data;
    } catch (error) {
      console.error(`Error al editar pedido con ID ${id}:`, error);
      throw error;
    }
  }

  // Calificar un pedido
  async rateOrder(id, ratingData) {
    try {
      const response = await api.post(`/calificaciones/calificar/${id}`, ratingData);
      return response.data;
    } catch (error) {
      console.error(`Error al calificar pedido con ID ${id}:`, error);
      throw error;
    }
  }

  // Obtener el estado de un pedido (tracking)
  async getOrderStatus(id) {
    try {
      const response = await api.get(`/pedidos/${id}/estado`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener estado del pedido con ID ${id}:`, error);
      throw error;
    }
  }

  // Procesar un pago para un pedido
  async processPayment(orderId, paymentData) {
    try {
      const response = await api.post(`/pagos/${orderId}/procesar`, paymentData);
      return response.data;
    } catch (error) {
      console.error(`Error al procesar pago para pedido ${orderId}:`, error);
      throw error;
    }
  }

  // Crear intención de pago con tarjeta
  async createPaymentIntent(orderId) {
    try {
      const response = await api.post(`/pagos/${orderId}/crear-intencion`);
      return response.data;
    } catch (error) {
      console.error(`Error al crear intención de pago para pedido ${orderId}:`, error);
      throw error;
    }
  }

  // Confirmar pago con tarjeta
  async confirmPayment(paymentIntentId) {
    try {
      const response = await api.post(`/pagos/confirmar`, { paymentIntentId });
      return response.data;
    } catch (error) {
      console.error(`Error al confirmar pago ${paymentIntentId}:`, error);
      throw error;
    }
  }
}

export default new OrderService();