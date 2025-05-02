// src/services/payment/CardPaymentStrategy.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class CardPaymentStrategy extends PaymentStrategy {
  async processPayment(amount, paymentInfo) {
    try {
      // Crear un pago con Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe trabaja con centavos
        currency: 'cop',
        description: `Pedido #${paymentInfo.pedidoId}`,
        payment_method: paymentInfo.paymentMethodId,
        confirm: true
      });
      
      // Registrar el pago en la base de datos
      const payment = await prisma.pagos.create({
        data: {
          monto: amount,
          metodoPago: 'tarjeta',
          pedido_Id: paymentInfo.pedidoId,
          estado: paymentIntent.status === 'succeeded' ? 'completado' : 'pendiente',
          referenciaPago: paymentIntent.id
        }
      });
      
      return {
        success: paymentIntent.status === 'succeeded',
        paymentId: payment.id,
        stripePaymentIntentId: paymentIntent.id,
        message: paymentIntent.status === 'succeeded' 
          ? 'Pago con tarjeta procesado correctamente' 
          : 'Pago con tarjeta pendiente de confirmación'
      };
    } catch (error) {
      console.error('Error al procesar pago con tarjeta:', error);
      throw new Error('No se pudo procesar el pago con tarjeta');
    }
  }

  async refundPayment(paymentId) {
    try {
      // Buscar el pago en la base de datos
      const payment = await prisma.pagos.findUnique({
        where: { id: paymentId }
      });
      
      if (!payment || !payment.referenciaPago) {
        throw new Error('Pago no encontrado o sin referencia de pago');
      }
      
      // Procesar el reembolso con Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.referenciaPago
      });
      
      // Actualizar el estado del pago
      await prisma.pagos.update({
        where: { id: paymentId },
        data: { estado: 'reembolsado' }
      });
      
      return {
        success: true,
        refundId: refund.id,
        message: 'Reembolso procesado correctamente'
      };
    } catch (error) {
      console.error('Error al procesar reembolso con tarjeta:', error);
      throw new Error('No se pudo procesar el reembolso con tarjeta');
    }
  }
}