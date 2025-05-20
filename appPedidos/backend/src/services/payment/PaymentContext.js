// src/services/payment/PaymentContext.js
//
class PaymentContext {
    constructor() {
      this.strategy = null;
    }
    
    setStrategy(strategy) {
      this.strategy = strategy;
    }
    
    async processPayment(amount, paymentInfo) {
      if (!this.strategy) {
        throw new Error('Estrategia de pago no establecida');
      }
      return await this.strategy.processPayment(amount, paymentInfo);
    }
    
    async refundPayment(paymentId) {
      if (!this.strategy) {
        throw new Error('Estrategia de pago no establecida');
      }
      return await this.strategy.refundPayment(paymentId);
    }
  }