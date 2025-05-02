// appPedidos/backend/src/controllers/pagos/PagosController.js (refactorizado)
const PagoRepository = require('../../repositories/PagoRepository');
const PedidoRepository = require('../../repositories/PedidoRepository');
const PaymentService = require('../../services/payment/PaymentService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PagosController {
  constructor() {
    this.pagoRepository = new PagoRepository();
    this.pedidoRepository = new PedidoRepository();
    this.paymentService = new PaymentService();
  }

  // Crear una intención de pago con Stripe para obtener un clientSecret
  async crearIntencionPago(req, res) {
    try {
      const { pedidoId } = req.params;
      const usuarioId = req.user.id;

      // Obtener el pedido y verificar permisos
      const pedido = await this.pedidoRepository.getPedidoById(pedidoId);

      if (!pedido) {
        return res.status(404).json({ message: 'Pedido no encontrado' });
      }

      if (pedido.usuario_id !== usuarioId) {
        return res.status(403).json({ message: 'No tienes permiso para pagar este pedido' });
      }

      // Verificar que el pedido no esté pagado ya
      const pagoExistente = await this.pagoRepository.getPaymentsByPedidoAndStatus(pedidoId, 'completado');

      if (pagoExistente && pagoExistente.length > 0) {
        return res.status(400).json({ message: 'El pedido ya ha sido pagado' });
      }

      // Crear intención de pago en Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(pedido.total * 100), // Convertir a centavos
        currency: 'cop',
        metadata: {
          pedidoId,
          usuarioId
        }
      });

      // Guardar referencia del pago en la base de datos
      await this.pagoRepository.createPayment({
        monto: pedido.total,
        metodoPago: 'tarjeta',
        pedido_Id: pedidoId,
        estado: 'pendiente',
        referenciaPago: paymentIntent.id,
        fechaCreacion: new Date()
      });

      res.status(200).json({
        clientSecret: paymentIntent.client_secret
      });
    } catch (error) {
      console.error('Error al crear intención de pago:', error);
      res.status(500).json({ message: 'Error al procesar el pago', error: error.message });
    }
  }

  // Confirmar un pago después de que el cliente completa el proceso en el frontend
  async confirmarPago(req, res) {
    try {
      const { paymentIntentId } = req.body;
      const usuarioId = req.user.id;

      // Verificar el estado del paymentIntent en Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Buscar el pago en la base de datos
      const pago = await this.pagoRepository.getPaymentByReference(paymentIntentId);

      if (!pago) {
        return res.status(404).json({ message: 'Pago no encontrado' });
      }

      // Verificar que el pedido pertenece al usuario
      const pedido = await this.pedidoRepository.getPedidoById(pago.pedido_Id);

      if (!pedido || pedido.usuario_id !== usuarioId) {
        return res.status(403).json({ message: 'No tienes permiso para confirmar este pago' });
      }

      // Actualizar el estado del pago según el resultado de Stripe
      const nuevoEstado = paymentIntent.status === 'succeeded' ? 'completado' : 
                          paymentIntent.status === 'canceled' ? 'cancelado' : 'pendiente';

      const pagoActualizado = await this.pagoRepository.updatePaymentStatus(pago.id, nuevoEstado);

      // Si el pago fue exitoso, actualizar el estado del pedido
      if (nuevoEstado === 'completado') {
        await this.pedidoRepository.updatePedido(pedido.id, { metodoPago: 'tarjeta' });
      }

      res.status(200).json({
        success: true,
        payment: pagoActualizado
      });
    } catch (error) {
      console.error('Error al confirmar pago:', error);
      res.status(500).json({ message: 'Error al confirmar el pago', error: error.message });
    }
  }

  // Procesar un pago directamente (para casos como pago en efectivo)
  async procesarPago(req, res) {
    try {
      const { pedidoId } = req.params;
      const { metodoPago, paymentMethodId } = req.body;
      const usuarioId = req.user.id;

      // Verificar que existe el pedido y pertenece al usuario
      const pedido = await this.pedidoRepository.getPedidoById(pedidoId);

      if (!pedido) {
        return res.status(404).json({ message: 'Pedido no encontrado' });
      }

      if (pedido.usuario_id !== usuarioId) {
        return res.status(403).json({ message: 'No tienes permiso para pagar este pedido' });
      }

      // Verificar que el pedido no esté pagado ya
      const pagoExistente = await this.pagoRepository.getPaymentsByPedidoAndStatus(pedidoId, 'completado');

      if (pagoExistente && pagoExistente.length > 0) {
        return res.status(400).json({ message: 'El pedido ya ha sido pagado' });
      }

      // Preparar la información del pago
      const paymentInfo = {
        method: metodoPago,
        pedidoId,
        paymentMethodId
      };

      // Procesar el pago usando el patrón Strategy
      const resultado = await this.paymentService.processPayment(pedido.total, paymentInfo);

      // Actualizar el método de pago en el pedido
      await this.pedidoRepository.updatePedido(pedidoId, { metodoPago });

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al procesar pago:', error);
      res.status(500).json({ message: 'Error al procesar el pago', error: error.message });
    }
  }

  // Obtener el historial de pagos del usuario
  async obtenerHistorialPagos(req, res) {
    try {
      const usuarioId = req.user.id;
      const { page = 1, limit = 10 } = req.query;

      const resultado = await this.pagoRepository.getPaymentsByUser(usuarioId, page, limit);
      
      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al obtener historial de pagos:', error);
      res.status(500).json({ message: 'Error al obtener historial de pagos', error: error.message });
    }
  }

  // Solicitar reembolso
  async solicitarReembolso(req, res) {
    try {
      const { pagoId } = req.params;
      const { motivo } = req.body;
      const usuarioId = req.user.id;

      // Buscar el pago
      const pago = await this.pagoRepository.getPaymentById(pagoId);

      if (!pago) {
        return res.status(404).json({ message: 'Pago no encontrado' });
      }

      // Verificar que el pedido pertenece al usuario
      const pedido = await this.pedidoRepository.getPedidoById(pago.pedido_Id);
      
      if (!pedido || pedido.usuario_id !== usuarioId) {
        return res.status(403).json({ message: 'No tienes permiso para solicitar este reembolso' });
      }

      // Verificar que el pago está completado y no reembolsado
      if (pago.estado !== 'completado') {
        return res.status(400).json({ message: 'Solo se pueden reembolsar pagos completados' });
      }

      // Procesar el reembolso usando el patrón Strategy
      const resultado = await this.paymentService.refundPayment(pagoId, pago.metodoPago);

      // Registrar la solicitud de reembolso
      await this.pagoRepository.createRefund({
        pago_Id: pagoId,
        motivo,
        estado: 'procesado',
        fechaSolicitud: new Date()
      });

      res.status(200).json(resultado);
    } catch (error) {
      console.error('Error al solicitar reembolso:', error);
      res.status(500).json({ message: 'Error al solicitar reembolso', error: error.message });
    }
  }

  // Webhook para recibir notificaciones de Stripe
  async webhookStripe(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Verificar la firma del webhook
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      // Manejar diferentes eventos de Stripe
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this._handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this._handlePaymentIntentFailed(event.data.object);
          break;
        case 'charge.refunded':
          await this._handleChargeRefunded(event.data.object);
          break;
        // Puedes manejar más eventos según sea necesario
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error en webhook de Stripe:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }

  // Métodos privados para manejar eventos de Stripe
  async _handlePaymentIntentSucceeded(paymentIntent) {
    try {
      // Actualizar el estado del pago en la base de datos
      await this.pagoRepository.updatePaymentsByReference(paymentIntent.id, { 
        estado: 'completado' 
      });

      console.log(`Pago ${paymentIntent.id} completado correctamente`);
    } catch (error) {
      console.error('Error al manejar pago exitoso:', error);
    }
  }

  async _handlePaymentIntentFailed(paymentIntent) {
    try {
      // Actualizar el estado del pago en la base de datos
      await this.pagoRepository.updatePaymentsByReference(paymentIntent.id, { 
        estado: 'fallido' 
      });

      console.log(`Pago ${paymentIntent.id} fallido`);
    } catch (error) {
      console.error('Error al manejar pago fallido:', error);
    }
  }

  async _handleChargeRefunded(charge) {
    try {
      // Buscar el pago por la referencia
      const pago = await this.pagoRepository.getPaymentByReference(charge.payment_intent);

      if (pago) {
        // Actualizar el estado del pago
        await this.pagoRepository.updatePaymentStatus(pago.id, 'reembolsado');
        console.log(`Pago ${pago.id} reembolsado correctamente`);
      }
    } catch (error) {
      console.error('Error al manejar reembolso:', error);
    }
  }
}

module.exports = new PagosController();