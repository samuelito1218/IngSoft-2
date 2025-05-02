// src/services/ChatService.js
import { ref, push, set, onValue, query, orderByChild } from 'firebase/database';
import { db } from '../firebase/config';
import api from './api';

class ChatService {
  // Send a message
  sendMessage = async (pedidoId, texto, receptorId) => {
    try {
      if (!pedidoId || !texto || !receptorId) {
        console.error('Missing required parameters for sending message');
        return null;
      }
      
      console.log('Sending message to backend API');
      
      // 1. Send message to backend
      const response = await api.post(`/mensajes/enviar/${pedidoId}`, {
        texto,
        usuarioReceptorId: receptorId
      });
      
      if (!response.data || !response.data.id) {
        throw new Error('Failed to send message to backend');
      }
      
      const messageData = response.data;
      
      // 2. Store in Firebase for real-time
      console.log('Storing message in Firebase');
      const messageRef = ref(db, `chats/${pedidoId}/messages/${messageData.id}`);
      await set(messageRef, {
        id: messageData.id,
        texto: messageData.texto,
        emisorId: messageData.usuarioEmisor,
        receptorId: messageData.usuarioReceptor,
        timestamp: Date.now(),
        leido: false
      });
      
      console.log('Message sent successfully');
      return messageData;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
  
  // Mark message as read
  markAsRead = async (mensajeId) => {
    try {
      if (!mensajeId) {
        console.error('Message ID is required');
        return;
      }
      
      // Call API to mark as read
      await api.put(`/mensajes/marcar-leido/${mensajeId}`);
      
      // Update Firebase
      // We need to find which chat this message belongs to
      // This is a simplified approach - in a real app, you might want to store the chat ID with the message
      const chatsRef = ref(db, 'chats');
      const allChats = await onValue(chatsRef, (snapshot) => {
        if (snapshot.exists()) {
          snapshot.forEach((chatSnapshot) => {
            const chatId = chatSnapshot.key;
            const messageRef = ref(db, `chats/${chatId}/messages/${mensajeId}`);
            
            onValue(messageRef, (msgSnapshot) => {
              if (msgSnapshot.exists()) {
                // Update the message
                set(messageRef, {
                  ...msgSnapshot.val(),
                  leido: true
                });
              }
            }, { onlyOnce: true });
          });
        }
      }, { onlyOnce: true });
      
      console.log('Message marked as read');
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  };
  
  // Subscribe to messages
  subscribeToMessages = (pedidoId, callback) => {
    if (!pedidoId || typeof callback !== 'function') {
      console.error('Invalid parameters for message subscription');
      return () => {};
    }
    
    console.log(`Subscribing to messages for pedido ${pedidoId}`);
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
        // Sort by timestamp
        messages.sort((a, b) => a.timestamp - b.timestamp);
        console.log(`Received ${messages.length} messages`);
        callback(messages);
      } else {
        console.log('No messages available');
        callback([]);
      }
    }, (error) => {
      console.error('Error in message subscription:', error);
    });
    
    // Return unsubscribe function to clean up
    return unsubscribe;
  };
}

export default new ChatService();