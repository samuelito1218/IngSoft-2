// src/services/ChatService.js
import ApiService, { api } from './api'; // Importamos ApiService y api correctamente
import { ref, push, set, onValue, query, orderByChild, get, update } from 'firebase/database';
import { db } from '../firebase/config';

class ChatService {
  // Enviar mensaje
  async sendMessage(pedidoId, texto, receptorId) {
    try {
      if (!pedidoId || !texto || !receptorId) {
        throw new Error('Parámetros incorrectos para enviar mensaje');
      }
      
      // 1. Enviar al backend
      const response = await ApiService.mensajes.enviar(pedidoId, texto, receptorId);
      
      if (!response.data || !response.data.id) {
        throw new Error('Error al enviar mensaje al backend');
      }
      
      const messageData = response.data;
      
      // 2. Guardar en Firebase para tiempo real
      const chatRef = ref(db, `chats/${pedidoId}`);
      const messageRef = ref(db, `chats/${pedidoId}/messages/${messageData.id}`);
      
      await set(messageRef, {
        id: messageData.id,
        texto: messageData.texto,
        emisorId: messageData.usuarioEmisor,
        receptorId: messageData.usuarioReceptor,
        timestamp: Date.now(),
        leido: false
      });
      
      // Actualizar metadata del chat
      const metaRef = ref(db, `chats/${pedidoId}/meta`);
      await update(metaRef, {
        lastMessage: {
          text: texto.length > 30 ? texto.substring(0, 30) + '...' : texto,
          timestamp: Date.now(),
          emisorId: messageData.usuarioEmisor
        },
        updatedAt: Date.now()
      });
      
      return messageData;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  }
  
  // Marcar mensaje como leído
  async markAsRead(mensajeId) {
    try {
      if (!mensajeId) {
        return;
      }
      
      // 1. Actualizar en el backend
      await ApiService.mensajes.marcarLeido(mensajeId);
      
      // 2. Buscar el mensaje en Firebase
      // Primero necesitamos encontrar en qué chat está el mensaje
      const chatsRef = ref(db, 'chats');
      const snapshot = await get(chatsRef);
      
      if (snapshot.exists()) {
        snapshot.forEach((chatSnapshot) => {
          const chatId = chatSnapshot.key;
          const messagesRef = ref(db, `chats/${chatId}/messages`);
          
          // Buscar el mensaje en este chat
          get(messagesRef).then((messagesSnapshot) => {
            if (messagesSnapshot.exists()) {
              messagesSnapshot.forEach((msgSnapshot) => {
                if (msgSnapshot.key === mensajeId) {
                  // Encontramos el mensaje, actualizarlo
                  const messageRef = ref(db, `chats/${chatId}/messages/${mensajeId}`);
                  update(messageRef, { leido: true });
                }
              });
            }
          });
        });
      }
    } catch (error) {
      console.error('Error al marcar mensaje como leído:', error);
    }
  }
  
  // Obtener mensajes (carga inicial)
  async getMessages(pedidoId) {
    try {
      if (!pedidoId) {
        throw new Error('ID de pedido requerido');
      }
      
      // Obtener del backend para histórico completo
      const response = await ApiService.mensajes.obtener(pedidoId);
      return response.data;
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      return [];
    }
  }
  
  // Suscribirse a nuevos mensajes
  subscribeToMessages(pedidoId, callback) {
    if (!pedidoId || typeof callback !== 'function') {
      console.error('Parámetros incorrectos para suscripción a mensajes');
      return () => {};
    }
    
    try {
      // Referencia a los mensajes en Firebase
      const messagesRef = ref(db, `chats/${pedidoId}/messages`);
      const messagesQuery = query(messagesRef, orderByChild('timestamp'));
      
      // Primero intentamos cargar los mensajes desde el backend
      this.getMessages(pedidoId)
        .then(initialMessages => {
          if (initialMessages && initialMessages.length > 0) {
            // Si hay mensajes en el backend, sincronizamos con Firebase
            initialMessages.forEach(msg => {
              const messageRef = ref(db, `chats/${pedidoId}/messages/${msg.id}`);
              set(messageRef, {
                id: msg.id,
                texto: msg.texto,
                emisorId: msg.usuarioEmisor,
                receptorId: msg.usuarioReceptor,
                timestamp: new Date(msg.fechaEnvio).getTime(),
                leido: msg.leido
              });
            });
            
            // Llamamos al callback con los mensajes iniciales
            callback(initialMessages);
          }
          
          // Luego nos suscribimos a cambios en tiempo real
          const unsubscribe = onValue(messagesQuery, (snapshot) => {
            const messages = [];
            
            if (snapshot.exists()) {
              snapshot.forEach(childSnapshot => {
                const message = childSnapshot.val();
                messages.push({
                  id: childSnapshot.key,
                  ...message
                });
              });
              
              // Ordenar por timestamp
              messages.sort((a, b) => a.timestamp - b.timestamp);
              
              // Llamar al callback con los mensajes
              callback(messages);
            } else {
              callback([]);
            }
          }, error => {
            console.error('Error en suscripción a mensajes:', error);
            callback([], error.message);
          });
          
          return unsubscribe;
        })
        .catch(error => {
          console.error('Error al cargar mensajes iniciales:', error);
          
          // Si hay error, igual nos suscribimos a cambios en tiempo real
          const unsubscribe = onValue(messagesQuery, (snapshot) => {
            const messages = [];
            
            if (snapshot.exists()) {
              snapshot.forEach(childSnapshot => {
                const message = childSnapshot.val();
                messages.push({
                  id: childSnapshot.key,
                  ...message
                });
              });
              
              // Ordenar por timestamp
              messages.sort((a, b) => a.timestamp - b.timestamp);
              
              // Llamar al callback con los mensajes
              callback(messages);
            } else {
              callback([]);
            }
          }, error => {
            console.error('Error en suscripción a mensajes:', error);
            callback([], error.message);
          });
          
          return unsubscribe;
        });
      
      // Devolvemos una función para desuscribirse
      return () => {
        console.log('Desuscripción de mensajes para pedido:', pedidoId);
        // La función real de desuscripción se asignará cuando se resuelva la promesa
      };
    } catch (error) {
      console.error('Error al suscribirse a mensajes:', error);
      return () => {};
    }
  }
  
  // Verificar si hay mensajes no leídos
  async hasUnreadMessages(pedidoId, usuarioId) {
    try {
      if (!pedidoId || !usuarioId) {
        return false;
      }
      
      // Verificar en Firebase
      const messagesRef = ref(db, `chats/${pedidoId}/messages`);
      const snapshot = await get(messagesRef);
      
      if (snapshot.exists()) {
        let hasUnread = false;
        
        snapshot.forEach(childSnapshot => {
          const message = childSnapshot.val();
          if (message.receptorId === usuarioId && !message.leido) {
            hasUnread = true;
          }
        });
        
        return hasUnread;
      }
      
      // Si no hay en Firebase, verificar en el backend
      try {
        const response = await ApiService.mensajes.obtener(pedidoId);
        const mensajes = response.data;
        return mensajes.some(m => m.usuarioReceptor === usuarioId && !m.leido);
      } catch (backendError) {
        console.error('Error al verificar mensajes no leídos en el backend:', backendError);
        return false;
      }
    } catch (error) {
      console.error('Error al verificar mensajes no leídos:', error);
      return false;
    }
  }
  
  // Método para verificar mensajes no leídos en todos los pedidos activos
  async checkUnreadMessages(usuarioId) {
    try {
      if (!usuarioId) return 0;
      
      // Implementar cuando el backend tenga el endpoint adecuado
      // Por ahora, buscar en Firebase
      const chatsRef = ref(db, 'chats');
      const snapshot = await get(chatsRef);
      
      let unreadCount = 0;
      
      if (snapshot.exists()) {
        const promises = [];
        
        snapshot.forEach(chatSnapshot => {
          const pedidoId = chatSnapshot.key;
          promises.push(this.hasUnreadMessages(pedidoId, usuarioId));
        });
        
        const results = await Promise.all(promises);
        unreadCount = results.filter(Boolean).length;
      }
      
      return unreadCount;
    } catch (error) {
      console.error('Error al verificar mensajes no leídos:', error);
      return 0;
    }
  }
  
  // Marcar todos los mensajes de un chat como leídos
  async markAllAsRead(pedidoId, usuarioId) {
    try {
      if (!pedidoId || !usuarioId) {
        return;
      }
      
      // 1. Actualizar en el backend (si tienes este endpoint)
      try {
        // Si tu backend tiene este endpoint
        await ApiService.mensajes.marcarTodosLeidos(pedidoId, usuarioId);
      } catch (backendError) {
        console.warn('No se pudieron marcar mensajes como leídos en el backend');
        
        // Si no existe el endpoint, marcar uno por uno
        const response = await ApiService.mensajes.obtener(pedidoId);
        const mensajes = response.data;
        
        for (const mensaje of mensajes) {
          if (mensaje.usuarioReceptor === usuarioId && !mensaje.leido) {
            await ApiService.mensajes.marcarLeido(mensaje.id);
          }
        }
      }
      
      // 2. Actualizar en Firebase
      const messagesRef = ref(db, `chats/${pedidoId}/messages`);
      const snapshot = await get(messagesRef);
      
      if (snapshot.exists()) {
        snapshot.forEach(childSnapshot => {
          const message = childSnapshot.val();
          
          if (message.receptorId === usuarioId && !message.leido) {
            const messageRef = ref(db, `chats/${pedidoId}/messages/${childSnapshot.key}`);
            update(messageRef, { leido: true });
          }
        });
      }
    } catch (error) {
      console.error('Error al marcar todos los mensajes como leídos:', error);
    }
  }
  
  // Eliminar historial de chat
  async clearChatHistory(pedidoId) {
    try {
      if (!pedidoId) {
        return;
      }
      
      // 1. Eliminar en el backend (si tienes este endpoint)
      try {
        // Si tu backend tiene este endpoint
        await ApiService.mensajes.eliminarHistorial(pedidoId);
      } catch (backendError) {
        console.warn('No se pudo eliminar historial en el backend');
      }
      
      // 2. Eliminar en Firebase
      const chatRef = ref(db, `chats/${pedidoId}`);
      await set(chatRef, null);
    } catch (error) {
      console.error('Error al eliminar historial de chat:', error);
      throw error;
    }
  }
}

export default new ChatService();