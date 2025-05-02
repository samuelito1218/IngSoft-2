// src/services/ChatService.js
import { ref, push, set, onValue, query, orderByChild } from 'firebase/database';
import { db } from '../firebase/config';
import api from './api'; // Tu servicio API existente

class ChatService {
  // Enviar un mensaje
  sendMessage = async (pedidoId, texto, receptorId) => {
    try {
      // 1. Enviar mensaje al backend
      const response = await api.post(`/api/mensajes/${pedidoId}`, {
        texto,
        usuarioReceptorId: receptorId
      });
      
      // 2. Guardar en Firebase para tiempo real
      const messageRef = ref(db, `chats/${pedidoId}/messages/${response.data.id}`);
      await set(messageRef, {
        id: response.data.id,
        texto: response.data.texto,
        emisorId: response.data.usuarioEmisor,
        receptorId: response.data.usuarioReceptor,
        timestamp: response.data.fechaEnvio,
        leido: false
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  };
  
  // Suscribirse a mensajes en tiempo real
  subscribeToMessages = (pedidoId, callback) => {
    const messagesRef = ref(db, `chats/${pedidoId}/messages`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'));
    
    return onValue(messagesQuery, (snapshot) => {
      const messages = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          messages.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        messages.sort((a, b) => a.timestamp - b.timestamp);
      }
      callback(messages);
    });
  };
}

export default new ChatService();