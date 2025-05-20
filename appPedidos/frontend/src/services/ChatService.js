// src/services/ChatService.js (con correcciones)//
import ApiService from './api'; // Corregido: ya no importamos api
import { ref, push, set, onValue, query, orderByChild, get, update } from 'firebase/database';
import { db } from '../firebase/config';

class ChatService {
  // Cache para recordar pedidos sin mensajes
  #pedidoSinMensajes = new Set();

  // Enviar mensaje
  async sendMessage(pedidoId, texto, receptorId) {
    try {
      if (!pedidoId || !texto || !receptorId) {
        throw new Error('Parámetros incorrectos para enviar mensaje');
      }
      
      // 1. Enviar al backend (corregido orden de parámetros)
      try {
        const response = await ApiService.mensajes.enviar(pedidoId, receptorId, texto);
        
        if (response.data && response.data.id) {
          const messageData = response.data;
          
          // 2. Guardar en Firebase para tiempo real
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
        }
      } catch (backendError) {
        console.warn('Error al enviar mensaje al backend, guardando solo en Firebase:', backendError);
        
        // Si falla el backend, guardar solo en Firebase con un ID temporal
        const chatRef = ref(db, `chats/${pedidoId}/messages`);
        const newMessageRef = push(chatRef); // Generar un ID único de Firebase
        const messageId = newMessageRef.key;
        
        const tempMessage = {
          id: messageId,
          texto: texto,
          emisorId: localStorage.getItem('userId'), // Obtener ID desde localStorage o context
          receptorId: receptorId,
          timestamp: Date.now(),
          leido: false,
          pendiente: true // Marcar como pendiente de sincronización
        };
        
        await set(newMessageRef, tempMessage);
        
        // Actualizar metadata del chat
        const metaRef = ref(db, `chats/${pedidoId}/meta`);
        await update(metaRef, {
          lastMessage: {
            text: texto.length > 30 ? texto.substring(0, 30) + '...' : texto,
            timestamp: Date.now(),
            emisorId: tempMessage.emisorId
          },
          updatedAt: Date.now()
        });
        
        return tempMessage;
      }
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
      try {
        await ApiService.mensajes.marcarLeido(mensajeId);
      } catch (backendError) {
        console.warn('No se pudo marcar como leído en el backend:', backendError);
        // Continuamos con Firebase aunque falle el backend
      }
      
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
    // Si ya sabemos que este pedido no tiene mensajes en el backend, no consultar
    if (this.#pedidoSinMensajes.has(pedidoId)) {
      console.log(`Omitiendo consulta al backend para pedido ${pedidoId} (sin mensajes confirmado)`);
      return [];
    }
    
    try {
      if (!pedidoId) {
        throw new Error('ID de pedido requerido');
      }
      
      // Obtener del backend para histórico completo
      const response = await ApiService.mensajes.obtener(pedidoId);
      return response.data || [];
    } catch (error) {
      // Si es un 404, recordarlo para no seguir consultando
      if (error.response && error.response.status === 404) {
        this.#pedidoSinMensajes.add(pedidoId);
        console.log(`Registrando pedido ${pedidoId} como sin mensajes en el backend`);
      }
      
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
      
      let unsubscribe = null;
      
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
          unsubscribe = onValue(messagesQuery, (snapshot) => {
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
        })
        .catch(error => {
          console.error('Error al cargar mensajes iniciales:', error);
          
          // Si hay error, igual nos suscribimos a cambios en tiempo real
          unsubscribe = onValue(messagesQuery, (snapshot) => {
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
        });
      
      // Devolvemos una función para desuscribirse
      return () => {
        console.log('Desuscripción de mensajes para pedido:', pedidoId);
        if (unsubscribe) unsubscribe();
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
      
      // Si no hay en Firebase y no sabemos que el pedido no tiene mensajes, verificar en el backend
      if (!this.#pedidoSinMensajes.has(pedidoId)) {
        try {
          const response = await ApiService.mensajes.obtener(pedidoId);
          const mensajes = response.data;
          return mensajes && mensajes.some(m => m.usuarioReceptor === usuarioId && !m.leido);
        } catch (backendError) {
          // Si es un 404, recordarlo
          if (backendError.response && backendError.response.status === 404) {
            this.#pedidoSinMensajes.add(pedidoId);
          }
          console.error('Error al verificar mensajes no leídos en el backend:', backendError);
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error al verificar mensajes no leídos:', error);
      return false;
    }
  }
  
  // Añadir este método a ChatService.js

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
}

export default new ChatService();