// src/components/shared/ChatComponent.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth'; // Tu contexto de autenticación
import ChatService from '../../services/ChatService';
import '../../styles/Chat.css';

function ChatComponent({ pedidoId, receptorId, receptorNombre }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    if (!pedidoId || !user) return;
    
    // Suscribirse a mensajes
    const unsubscribe = ChatService.subscribeToMessages(pedidoId, (newMessages) => {
      setMessages(newMessages);
      scrollToBottom();
    });
    
    return () => unsubscribe();
  }, [pedidoId, user]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      await ChatService.sendMessage(pedidoId, newMessage, receptorId);
      setNewMessage('');
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    }
  };
  
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
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}

export default ChatComponent;