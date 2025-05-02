// src/components/shared/ChatComponent.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ChatService from '../../services/ChatService';
import '../../styles/Chat.css';

function ChatComponent({ pedidoId, receptorId, receptorNombre }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Load initial messages and subscribe to updates
  useEffect(() => {
    if (!pedidoId || !user || !receptorId) {
      console.log('Missing required props:', { pedidoId, userId: user?.id, receptorId });
      return;
    }
    
    setLoading(true);
    console.log(`Loading messages for pedido ${pedidoId}`);
    
    try {
      // Subscribe to real-time updates
      const unsubscribe = ChatService.subscribeToMessages(pedidoId, (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
        scrollToBottom();
      });
      
      // Clean up subscription on unmount
      return () => {
        console.log('Unsubscribing from messages');
        unsubscribe();
      };
    } catch (err) {
      console.error('Error setting up chat:', err);
      setError('No se pudieron cargar los mensajes');
      setLoading(false);
    }
  }, [pedidoId, user, receptorId]);
  
  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !pedidoId || !receptorId) {
      return;
    }
    
    try {
      setNewMessage('');
      await ChatService.sendMessage(pedidoId, newMessage.trim(), receptorId);
      // No need to update messages here as the subscription will handle it
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      setError('No se pudo enviar el mensaje. Intenta de nuevo.');
      // Re-enable the input
      setNewMessage(newMessage.trim());
    }
  };
  
  // Mark messages as read when viewed
  useEffect(() => {
    if (!user || messages.length === 0) return;
    
    // Find unread messages sent to this user
    const unreadMessages = messages.filter(
      msg => msg.receptorId === user.id && !msg.leido
    );
    
    // Mark them as read
    unreadMessages.forEach(async (msg) => {
      try {
        await ChatService.markAsRead(msg.id);
      } catch (err) {
        console.error(`Error marking message ${msg.id} as read:`, err);
      }
    });
  }, [messages, user]);
  
  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <h3>Chat con {receptorNombre}</h3>
        </div>
        <div className="messages-container">
          <div className="loading-messages">Cargando mensajes...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <h3>Chat con {receptorNombre}</h3>
        </div>
        <div className="messages-container">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat con {receptorNombre}</h3>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>Aún no hay mensajes</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.emisorId === user.id ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                <p>{msg.texto}</p>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="message-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim() || loading}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}

export default ChatComponent;