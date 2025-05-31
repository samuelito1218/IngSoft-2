import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ChatService from '../../services/ChatService';
import '../../styles/ChatComponent.css';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';

function ChatComponent({ pedidoId, receptorId, receptorNombre }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  };
  
  
  useEffect(() => {
    if (!pedidoId || !user || !receptorId) {
      console.log('Falta información necesaria para el chat:', { pedidoId, userId: user?.id, receptorId });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      
      const unsubscribe = ChatService.subscribeToMessages(pedidoId, (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
        
        setTimeout(() => scrollToBottom(), 100);
      });
      
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    } catch (err) {
      console.error('Error en configuración de chat:', err);
      setError('No se pudieron cargar los mensajes. Intente nuevamente.');
      setLoading(false);
    }
  }, [pedidoId, user, receptorId]);
  
  
  useEffect(() => {
    if (!user || messages.length === 0) return;
    
    const unreadMessages = messages.filter(
      msg => msg.receptorId === user.id && !msg.leido
    );
    
    unreadMessages.forEach(async (msg) => {
      try {
        await ChatService.markAsRead(msg.id);
      } catch (err) {
        console.error(`Error al marcar mensaje ${msg.id} como leído:`, err);
      }
    });
  }, [messages, user]);
  
  // función para enviar un nuevo mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !pedidoId || !receptorId || sending) {
      return;
    }
    
    try {
      setSending(true);
      const messageText = newMessage.trim();
      setNewMessage('');
      
      await ChatService.sendMessage(pedidoId, messageText, receptorId);
      scrollToBottom(false);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      setError('Error al enviar mensaje. Intente nuevamente.');
      setNewMessage(newMessage.trim());
    } finally {
      setSending(false);
    }
  };
  
  // Manejo de la tecla Enter para enviar mensaje
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };
  
  
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <h3>Chat con {receptorNombre || 'Usuario'}</h3>
        </div>
        <div className="messages-container loading">
          <div className="spinner-container">
            <FaSpinner className="spinner" />
            <p>Cargando mensajes...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <h3>Chat con {receptorNombre || 'Usuario'}</h3>
        </div>
        <div className="messages-container">
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat con {receptorNombre || 'Usuario'}</h3>
      </div>
      
      <div className="messages-container" ref={chatContainerRef}>
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>Aún no hay mensajes</p>
            <p className="hint">Envía el primer mensaje para comenzar la conversación</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const isSent = msg.emisorId === user.id;
              const showSenderInfo = index === 0 || messages[index-1].emisorId !== msg.emisorId;
              
              return (
                <div 
                  key={msg.id} 
                  className={`message ${isSent ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <p>{msg.texto}</p>
                    <span className="message-time">
                      {formatMessageTime(msg.timestamp)}
                      {isSent && msg.leido && <span className="read-status">✓</span>}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <form className="message-form" onSubmit={handleSendMessage}>
        <textarea
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending}
          rows={1}
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim() || sending}
          className={sending ? 'sending' : ''}
        >
          {sending ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
        </button>
      </form>
    </div>
  );
}

export default ChatComponent;