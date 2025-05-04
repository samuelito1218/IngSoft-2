// src/services/ChatService.js
import api from './api';
import { ref, push, set, onValue, query, orderByChild, get } from 'firebase/database';
import { db } from '../firebase/config';

class ChatService {
  // Enviar un mensaje
  async sendMessage(pedidoId, texto, receptorId) {
    try {
      if (!pedidoId || !texto || !receptorId) {
        console.error('Faltan parámetros requeridos para enviar mensaje');
        throw new Error('Parámetros incorrectos');
      }
      
      // 1. Enviar mensaje al backend
      const response = await api.post(`/mensajes/enviar/${pedidoId}`, {
        texto,
        usuarioReceptorId: receptorId
      });
      
      if (!response.data || !response.data.id) {
        throw new Error('Error al enviar mensaje al backend');
      }
      
      const messageData = response.data;
      
      // 2. Almacenar en Firebase para tiempo real
      const messageRef = ref(db, `chats/${pedidoId}/messages/${messageData.id}`);
      await set(messageRef, {
        id: messageData.id,
        texto: messageData.texto,
        emisorId: messageData.usuarioEmisor,
        receptorId: messageData.usuarioReceptor,
        timestamp: Date.now(),
        leido: false
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
        console.error('ID de mensaje requerido');
        return;
      }
      
      // Llamar a la API para marcar como leído
      await api.put(`/mensajes/marcar-leido/${mensajeId}`);
      
      // Actualizar Firebase
      // Buscar en qué chat está este mensaje
      const chatsRef = ref(db, 'chats');
      
      // Recorrer los chats para encontrar el mensaje
      const snapshot = await get(chatsRef);
      if (snapshot.exists()) {
        snapshot.forEach((chatSnapshot) => {
          const chatId = chatSnapshot.key;
          const messageRef = ref(db, `chats/${chatId}/messages/${mensajeId}`);
          
          get(messageRef).then((msgSnapshot) => {
            if (msgSnapshot.exists()) {
              set(messageRef, {
                ...msgSnapshot.val(),
                leido: true
              });
            }
          });
        });
      }
    } catch (error) {
      console.error('Error al marcar mensaje como leído:', error);
      throw error;
    }
  }
  
  // Suscribirse a mensajes de un chat
  subscribeToMessages(pedidoId, callback) {
    if (!pedidoId || typeof callback !== 'function') {
      console.error('Parámetros inválidos para suscripción de mensajes');
      return () => {};
    }
    
    try {
      const messagesRef = ref(db, `chats/${pedidoId}/messages`);
      const messagesQuery = query(messagesRef, orderByChild('timestamp'));
      
      const unsubscribe = onValue(messagesQuery, (snapshot) => {
        const messages = [];
        if (snapshot.exists()) {
          snapshot.forEach((childSnapshot) => {
            messages.push({
              id: childSnapshot.key,
              ...childSnapshot.val()
            });
          });
          
          // Ordenar por timestamp
          messages.sort((a, b) => a.timestamp - b.timestamp);
          callback(messages);
        } else {
          callback([]);
        }
      }, (error) => {
        console.error('Error en la suscripción de mensajes:', error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error al suscribirse a mensajes:', error);
      return () => {};
    }
  }
  
  // Obtener historial de mensajes (fallback al método de API)
  async getMessageHistory(pedidoId) {
    try {
      const response = await api.get(`/mensajes/${pedidoId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial de mensajes:', error);
      return [];
    }
  }
  
  // Verificar si hay mensajes no leídos
  async hasUnreadMessages(pedidoId, usuarioId) {
    try {
      // Intentar verificar en Firebase primero
      const messagesRef = ref(db, `chats/${pedidoId}/messages`);
      const snapshot = await get(messagesRef);
      
      if (snapshot.exists()) {
        let hasUnread = false;
        snapshot.forEach((childSnapshot) => {
          const message = childSnapshot.val();
          if (message.receptorId === usuarioId && !message.leido) {
            hasUnread = true;
          }
        });
        return hasUnread;
      }
      
      // Fallback a la API
      const response = await api.get(`/mensajes/${pedidoId}/no-leidos`);
      return response.data.tieneNoLeidos || false;
    } catch (error) {
      console.error('Error al verificar mensajes no leídos:', error);
      return false;
    }
  }
}

export default new ChatService();