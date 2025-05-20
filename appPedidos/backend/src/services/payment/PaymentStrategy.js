//
class PaymentStrategy {
    constructor() {
      if (this.constructor === PaymentStrategy) {
        throw new Error("PaymentStrategy es una clase abstracta y no puede ser instanciada directamente");
      }
    }
  
    async processPayment(amount, paymentInfo) {
      throw new Error("El método processPayment debe ser implementado por las clases hijas");
    }
  
    async refundPayment(paymentId) {
      throw new Error("El método refundPayment debe ser implementado por las clases hijas");
    }
  }