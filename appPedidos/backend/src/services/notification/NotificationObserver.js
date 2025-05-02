// src/services/notification/NotificationObserver.js
// Interfaz para observadores de notificaciones
class NotificationObserver {
    constructor() {
      if (this.constructor === NotificationObserver) {
        throw new Error("NotificationObserver es una clase abstracta y no puede ser instanciada directamente");
      }
    }
  
    update(notification) {
      throw new Error("El método update debe ser implementado por las clases hijas");
    }
  }
  
  // src/services/notification/NotificationSubject.js
  // Sujeto observado que notifica a los observadores
  class NotificationSubject {
    constructor() {
      this.observers = [];
    }
  
    attach(observer) {
      const isExist = this.observers.includes(observer);
      if (isExist) {
        return console.log('Subject: Observer ya ha sido agregado');
      }
  
      this.observers.push(observer);
    }
  
    detach(observer) {
      const observerIndex = this.observers.indexOf(observer);
      if (observerIndex === -1) {
        return console.log('Subject: Observer no encontrado');
      }
  
      this.observers.splice(observerIndex, 1);
    }
  
    notify(notification) {
      for (const observer of this.observers) {
        observer.update(notification);
      }
    }
  }
  
  // src/services/notification/FirebaseNotificationObserver.js
  const admin = require('firebase-admin');
  const { getFirestore } = require('firebase-admin/firestore');
  
  class FirebaseNotificationObserver extends NotificationObserver {
    constructor() {
      super();
      // Asumimos que Firebase Admin ya está inicializado en la aplicación
      this.db = getFirestore();
    }
  
    async update(notification) {
      try {
        // Guardar la notificación en Firestore
        await this.db.collection('notifications').add({
          userId: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
  
        console.log(`Notificación enviada a Firebase para el usuario ${notification.userId}`);
      } catch (error) {
        console.error('Error al enviar notificación a Firebase:', error);
      }
    }
  }
  
  // src/services/notification/WebSocketNotificationObserver.js
  class WebSocketNotificationObserver extends NotificationObserver {
    constructor(io) {
      super();
      this.io = io; // Socket.io instance
    }
  
    update(notification) {
      try {
        // Emitir la notificación al usuario específico a través de Socket.io
        this.io.to(notification.userId).emit('notification', {
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data,
          timestamp: new Date()
        });
  
        console.log(`Notificación enviada por WebSocket al usuario ${notification.userId}`);
      } catch (error) {
        console.error('Error al enviar notificación por WebSocket:', error);
      }
    }
  }
  
  // src/services/notification/PushNotificationObserver.js
  const { Expo } = require('expo-server-sdk');
  
  class PushNotificationObserver extends NotificationObserver {
    constructor() {
      super();
      // Inicializar el SDK de Expo para Push Notifications
      this.expo = new Expo();
    }
  
    async update(notification) {
      try {
        // Buscar tokens de push del usuario
        const tokens = await this._getUserPushTokens(notification.userId);
        
        if (!tokens || tokens.length === 0) {
          return console.log(`No hay tokens de push para el usuario ${notification.userId}`);
        }
  
        // Crear mensajes para Expo
        const messages = tokens.map(token => ({
          to: token,
          sound: 'default',
          title: notification.title,
          body: notification.message,
          data: notification.data,
          badge: 1,
        }));
  
        // Enviar notificaciones
        const chunks = this.expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
          await this.expo.sendPushNotificationsAsync(chunk);
        }
  
        console.log(`Notificación push enviada al usuario ${notification.userId}`);
      } catch (error) {
        console.error('Error al enviar notificación push:', error);
      }
    }
  
    async _getUserPushTokens(userId) {
      // En una implementación real, buscarías los tokens en la base de datos
      // Aquí simplemente simulamos la búsqueda
      return []; // Retorna un array vacío para evitar errores en este ejemplo
    }
  }
  
  // src/services/notification/EmailNotificationObserver.js
  const nodemailer = require('nodemailer');
  
  class EmailNotificationObserver extends NotificationObserver {
    constructor() {
      super();
      // Configurar el transporter de Nodemailer
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
  
    async update(notification) {
      try {
        // Obtener el email del usuario
        const userEmail = await this._getUserEmail(notification.userId);
        
        if (!userEmail) {
          return console.log(`No se encontró email para el usuario ${notification.userId}`);
        }
  
        // Enviar el email
        await this.transporter.sendMail({
          from: `"FastFood" <${process.env.EMAIL_FROM}>`,
          to: userEmail,
          subject: notification.title,
          text: notification.message,
          html: this._generateEmailHtml(notification)
        });
  
        console.log(`Notificación por email enviada a ${userEmail}`);
      } catch (error) {
        console.error('Error al enviar notificación por email:', error);
      }
    }
  
    async _getUserEmail(userId) {
      // En una implementación real, buscarías el email en la base de datos
      try {
        const user = await prisma.usuarios.findUnique({
          where: { id: userId },
          select: { email: true }
        });
        return user ? user.email : null;
      } catch (error) {
        console.error('Error al obtener email del usuario:', error);
        return null;
      }
    }
  
    _generateEmailHtml(notification) {
      // Template básico para el email
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #ff4b2b; color: white; padding: 20px; text-align: center;">
            <h1>${notification.title}</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #eee;">
            <p>${notification.message}</p>
            ${notification.data ? `<p>Detalles adicionales: ${JSON.stringify(notification.data)}</p>` : ''}
          </div>
          <div style="background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>© ${new Date().getFullYear()} FastFood. Todos los derechos reservados.</p>
          </div>
        </div>
      `;
    }
  }
  
  // src/services/notification/NotificationService.js
  class NotificationService {
    constructor() {
      this.subject = new NotificationSubject();
    }
  
    registerObserver(observer) {
      this.subject.attach(observer);
    }
  
    removeObserver(observer) {
      this.subject.detach(observer);
    }
  
    // Métodos para diferentes tipos de notificaciones
    // Pedidos
    notifyOrderCreated(userId, order) {
      this.subject.notify({
        userId,
        title: 'Pedido creado',
        message: `Tu pedido #${order.id} ha sido creado correctamente`,
        type: 'order_created',
        data: { orderId: order.id }
      });
    }
  
    notifyOrderAssigned(userId, order, repartidor) {
      this.subject.notify({
        userId,
        title: 'Repartidor asignado',
        message: `${repartidor.nombreCompleto} ha sido asignado a tu pedido #${order.id}`,
        type: 'order_assigned',
        data: { orderId: order.id, repartidorId: repartidor.id }
      });
    }
  
    notifyOrderInProgress(userId, order) {
      this.subject.notify({
        userId,
        title: 'Pedido en camino',
        message: `Tu pedido #${order.id} está en camino`,
        type: 'order_in_progress',
        data: { orderId: order.id }
      });
    }
  
    notifyOrderDelivered(userId, order) {
      this.subject.notify({
        userId,
        title: 'Pedido entregado',
        message: `Tu pedido #${order.id} ha sido entregado`,
        type: 'order_delivered',
        data: { orderId: order.id }
      });
    }
  
    // Repartidores
    notifyNewOrderAvailable(userId, order) {
      this.subject.notify({
        userId,
        title: 'Nuevo pedido disponible',
        message: `Hay un nuevo pedido disponible para entregar`,
        type: 'new_order_available',
        data: { orderId: order.id }
      });
    }
  
    // Mensajes
    notifyNewMessage(userId, message) {
      this.subject.notify({
        userId,
        title: 'Nuevo mensaje',
        message: `Tienes un nuevo mensaje de ${message.emisorNombre}`,
        type: 'new_message',
        data: { messageId: message.id, pedidoId: message.pedido_Id }
      });
    }
  
    // Pagos
    notifyPaymentReceived(userId, payment) {
      this.subject.notify({
        userId,
        title: 'Pago recibido',
        message: `Hemos recibido tu pago de ${payment.monto.toLocaleString()} para el pedido #${payment.pedido_Id}`,
        type: 'payment_received',
        data: { paymentId: payment.id, pedidoId: payment.pedido_Id }
      });
    }
  
    // Puede añadir más métodos según sea necesario...
  }
  
  module.exports = {
    NotificationObserver,
    NotificationSubject,
    FirebaseNotificationObserver,
    WebSocketNotificationObserver,
    PushNotificationObserver,
    EmailNotificationObserver,
    NotificationService
  };