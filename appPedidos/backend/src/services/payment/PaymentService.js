// src/services/payment/PaymentService.js
const CashPaymentStrategy = require('./CashPaymentStrategy');
const CardPaymentStrategy = require('./CardPaymentStrategy');
const PaymentContext = require('./PaymentContext');
//
class PaymentService {
  constructor() {
    this.paymentContext = new PaymentContext();
  }
  
  async processPayment(amount, paymentInfo) {
    try {
      // Seleccionar la estrategia según el método de pago
      if (paymentInfo.method === 'efectivo') {
        this.paymentContext.setStrategy(new CashPaymentStrategy());
      } else if (paymentInfo.method === 'tarjeta') {
        this.paymentContext.setStrategy(new CardPaymentStrategy());
      } else {
        throw new Error('Método de pago no soportado');
      }
      
      // Procesar el pago con la estrategia seleccionada
      return await this.paymentContext.processPayment(amount, paymentInfo);
    } catch (error) {
      console.error('Error en el servicio de pagos:', error);
      throw error;
    }
  }
  
  async refundPayment(paymentId, paymentMethod) {
    try {
      // Seleccionar la estrategia según el método de pago
      if (paymentMethod === 'efectivo') {
        this.paymentContext.setStrategy(new CashPaymentStrategy());
      } else if (paymentMethod === 'tarjeta') {
        this.paymentContext.setStrategy(new CardPaymentStrategy());
      } else {
        throw new Error('Método de pago no soportado');
      }
      
      // Procesar el reembolso con la estrategia seleccionada
      return await this.paymentContext.refundPayment(paymentId);
    } catch (error) {
      console.error('Error en el servicio de reembolsos:', error);
      throw error;
    }
  }
}

module.exports = PaymentService;