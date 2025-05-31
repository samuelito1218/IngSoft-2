import ApiService from './api'; 
import { ref, push, set, onValue, query, orderByChild, get, update } from 'firebase/database';
import { db } from '../firebase/config';

class ChatService {
  #pedidoSinMensajes = new Set();

  // Enviar mensaje
  async sendMessage(pedidoId, texto, receptorId) {
    try {
      if (!pedidoId || !texto || !receptorId) {
        throw new Error('Parámetros incorrectos para enviar mensaje');
      }
      
      try {
        const response = await ApiService.mensajes.enviar(pedidoId, receptorId, texto);
        
        if (response.data && response.data.id) {
          const messageData = response.data;
          
          const messageRef = ref(db, `chats/${pedidoId}/messages/${messageData.id}`);
          
          await set(messageRef, {
            id: messageData.id,
            texto: messageData.texto,
            emisorId: messageData.usuarioEmisor,
            receptorId: messageData.usuarioReceptor,
            timestamp: Date.now(),
            leido: false
          });
          
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
        
        const chatRef = ref(db, `chats/${pedidoId}/messages`);
        const newMessageRef = push(chatRef); 
        const messageId = newMessageRef.key;
        
        const tempMessage = {
          id: messageId,
          texto: texto,
          emisorId: localStorage.getItem('userId'), 
          receptorId: receptorId,
          timestamp: Date.now(),
          leido: false,
          pendiente: true 
        };
        
        await set(newMessageRef, tempMessage);
        
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
  
  async markAsRead(mensajeId) {
    try {
      if (!mensajeId) {
        return;
      }
      
      try {
        await ApiService.mensajes.marcarLeido(mensajeId);
      } catch (backendError) {
        console.warn('No se pudo marcar como leído en el backend:', backendError);
      }
      
      const chatsRef = ref(db, 'chats');
      const snapshot = await get(chatsRef);
      
      if (snapshot.exists()) {
        snapshot.forEach((chatSnapshot) => {
          const chatId = chatSnapshot.key;
          const messagesRef = ref(db, `chats/${chatId}/messages`);
          
          get(messagesRef).then((messagesSnapshot) => {
            if (messagesSnapshot.exists()) {
              messagesSnapshot.forEach((msgSnapshot) => {
                if (msgSnapshot.key === mensajeId) {
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
  
  async getMessages(pedidoId) {
    if (this.#pedidoSinMensajes.has(pedidoId)) {
      console.log(`Omitiendo consulta al backend para pedido ${pedidoId} (sin mensajes confirmado)`);
      return [];
    }
    
    try {
      if (!pedidoId) {
        throw new Error('ID de pedido requerido');
      }
      
      const response = await ApiService.mensajes.obtener(pedidoId);
      return response.data || [];
    } catch (error) {
      if (error.response && error.response.status === 404) {
        this.#pedidoSinMensajes.add(pedidoId);
        console.log(`Registrando pedido ${pedidoId} como sin mensajes en el backend`);
      }
      
      console.error('Error al obtener mensajes:', error);
      return [];
    }
  }
  
  subscribeToMessages(pedidoId, callback) {
    if (!pedidoId || typeof callback !== 'function') {
      console.error('Parámetros incorrectos para suscripción a mensajes');
      return () => {};
    }
    
    try {
      const messagesRef = ref(db, `chats/${pedidoId}/messages`);
      const messagesQuery = query(messagesRef, orderByChild('timestamp'));
      
      let unsubscribe = null;
      
      this.getMessages(pedidoId)
        .then(initialMessages => {
          if (initialMessages && initialMessages.length > 0) {
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
            
            callback(initialMessages);
          }
          
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
              
              messages.sort((a, b) => a.timestamp - b.timestamp);
              
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
              
              messages.sort((a, b) => a.timestamp - b.timestamp);
              
              callback(messages);
            } else {
              callback([]);
            }
          }, error => {
            console.error('Error en suscripción a mensajes:', error);
            callback([], error.message);
          });
        });
      
      return () => {
        console.log('Desuscripción de mensajes para pedido:', pedidoId);
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error('Error al suscribirse a mensajes:', error);
      return () => {};
    }
  }
  
  async hasUnreadMessages(pedidoId, usuarioId) {
    try {
      if (!pedidoId || !usuarioId) {
        return false;
      }
      
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
      
      if (!this.#pedidoSinMensajes.has(pedidoId)) {
        try {
          const response = await ApiService.mensajes.obtener(pedidoId);
          const mensajes = response.data;
          return mensajes && mensajes.some(m => m.usuarioReceptor === usuarioId && !m.leido);
        } catch (backendError) {
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
  

  async checkUnreadMessages(usuarioId) {
    try {
      if (!usuarioId) return 0;
      
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