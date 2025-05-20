// src/services/payment/CashPaymentStrategy.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
//
class CashPaymentStrategy extends PaymentStrategy {
  async processPayment(amount, paymentInfo) {
    try {
      // Registrar el pago en efectivo en la base de datos
      const payment = await prisma.pagos.create({
        data: {
          monto: amount,
          metodoPago: 'efectivo',
          pedido_Id: paymentInfo.pedidoId,
          estado: 'pendiente' // Pendiente hasta que el repartidor reciba el efectivo
        }
      });
      
      return {
        success: true,
        paymentId: payment.id,
        message: 'Pago en efectivo registrado. Pagar al repartidor al momento de la entrega.'
      };
    } catch (error) {
      console.error('Error al procesar pago en efectivo:', error);
      throw new Error('No se pudo procesar el pago en efectivo');
    }
  }

  async refundPayment(paymentId) {
    try {
      // Actualizar el estado del pago a "reembolsado"
      await prisma.pagos.update({
        where: { id: paymentId },
        data: { estado: 'reembolsado' }
      });
      
      return {
        success: true,
        message: 'Reembolso en efectivo registrado.'
      };
    } catch (error) {
      console.error('Error al procesar reembolso en efectivo:', error);
      throw new Error('No se pudo procesar el reembolso en efectivo');
    }
  }
}
