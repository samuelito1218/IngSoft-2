import React, { useState, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import ChatPedido from '../repartidor/ChatPedido';
import '../../styles/ChatPedido.css';
import { useAuth } from "../../hooks/useAuth";

const FloatingChatButton = () => {
  const { user } = useAuth();
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [tieneNotificaciones, setTieneNotificaciones] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPedidoActivo = async () => {
      try {
        setLoading(true);
        const response = await ApiService.pedidos.repartidorActivos();
        
        if (response.data && response.data.length > 0) {
          // Tomar el primer pedido activo
          setPedidoActivo(response.data[0]);
          // Carga los mensajes si hay un pedido activo
          if (response.data[0].id) {
            fetchMensajes(response.data[0].id);
          }
          // Simulación de notificaciones
          setTieneNotificaciones(Math.random() > 0.5);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar pedido activo:', error);
        setLoading(false);
      }
    };
    
    fetchPedidoActivo();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchPedidoActivo, 30000);
    
    return () => clearInterval(interval);
  }, []);

  //Función para cargar mensajes
  const fetchMensajes = async (id) => {
    try {
        if(!id) return;
        const response = await ApiService.mensajes.obtener(id);
        console.log('Mensajes obtenidos:', response.data);
         if (response.data && Array.isArray(response.data)) {
        const mensajesProcesados = response.data.map(mensaje => ({
          id: mensaje.id || `temp-${Date.now()}-${Math.random()}`,
          contenido: mensaje.texto || mensaje.contenido || '', 
          fechaCreacion: mensaje.fechaEnvio || mensaje.fechaCreacion || new Date().toISOString(),
          tipoEmisor: mensaje.usuarioEmisor === user.id ? 'REPARTIDOR' : 'CLIENTE'
        }));

        setMensajes(mensajesProcesados);
         }}
         catch (error) {
            console.error('Error al cargar mensajes:', error);
        };
    };

    // Función para enviar mensajes desde el chat flotante

    const handleEnviarMensaje = async (e) => {
        e.preventDefault();
        if (!nuevoMensaje.trim() || !pedidoActivo?.id) return;
        try {
            setEnviando(true);
            let usuarioReceptorId;
            if (user.rol === 'REPARTIDOR') {
                usuarioReceptorId = pedidoActivo.usuario_id;
            } else {
                usuarioReceptorId = pedidoActivo.repartidor_Id;
            }
            console.log("Datos de envío:", {
                miRol: user.rol,
                miId: user.id,
                pedidoId: pedidoActivo.id,
                usuarioReceptorId,
                mensaje: nuevoMensaje.trim()
            
            });
            
            if (!usuarioReceptorId) {
                console.error("No se pudo determinar el destinatario", pedidoActivo);
                throw new Error('No se pudo identificar al destinatario del mensaje');
            }
    
    const mensajeOptimista = {
      id: `temp-${Date.now()}`,
      contenido: nuevoMensaje.trim(),
      fechaCreacion: new Date().toISOString(),
      tipoEmisor: user.rol === 'REPARTIDOR' ? 'REPARTIDOR' : 'CLIENTE',
      pendiente: true
    };
    
    setMensajes(prev => [...prev, mensajeOptimista]);
    setNuevoMensaje('');
    
    const response = await ApiService.mensajes.enviar(
      pedidoActivo.id,      
      usuarioReceptorId,    
      nuevoMensaje.trim()   
    );
    
    console.log("Respuesta del servidor:", response);
    
    // Recargar mensajes
    await fetchMensajes(pedidoActivo.id);
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    
    let errorMessage = 'Error al enviar el mensaje. Por favor, intenta nuevamente.';
    
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
      if (error.response.status === 403) {
        errorMessage = 'No tienes permiso para enviar mensajes en este pedido.';
      }
    }
    
    alert(errorMessage);
  } finally {
    setEnviando(false);
  }
};
  

  const handleChatClick = () => {
    if (pedidoActivo) {
      if (chatOpen) {
        setChatOpen(false);
      } else {
        setChatOpen(true);
        setTieneNotificaciones(false);
        if(pedidoActivo.id) {
          fetchMensajes(pedidoActivo.id);
        }
      }
    }
  };

  const navigateToFullChat = () => {
    if (pedidoActivo && pedidoActivo.id) {
      navigate(`/repartidor/chat/${pedidoActivo.id}`);
    }
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '';
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  // No mostrar el icono si no hay un pedido activo
  if (loading || !pedidoActivo || !pedidoActivo.id) {
    return null;
  }

  const clienteNombre = pedidoActivo.cliente?.nombreCompleto || 
                        (pedidoActivo.cliente?.nombre || 'Cliente');

 return (
  <>
    {chatOpen && (
      <div className="floating-chat">
        <div className="floating-chat-header">
          <h3>Chat con {clienteNombre}</h3>
          <button className="close-button" onClick={() => setChatOpen(false)}>
            <FaTimes />
          </button>
        </div>
        <div className="floating-chat-body">
          {mensajes.length === 0 ? (
            <div className="chat-empty-mini">
              <p>No hay mensajes aún</p>
            </div>
          ) : (
            <div className="mini-chat-messages">
              {mensajes.map((mensaje) => (
                <div 
                  key={mensaje.id} 
                  className={`mini-mensaje ${mensaje.tipoEmisor === 'REPARTIDOR' ? 'enviado' : 'recibido'} ${mensaje.pendiente ? 'pendiente' : ''}`}
                >
                  <div className="mini-mensaje-contenido">
                    <div className="mini-mensaje-texto">
                      {mensaje.contenido}
                    </div>
                    <div className="mini-mensaje-hora">
                      {formatFecha(mensaje.fechaCreacion)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="floating-chat-footer">
          <form className="mini-chat-input-container" onSubmit={handleEnviarMensaje}>
            <input
              type="text"
              className="mini-chat-input"
              placeholder="Escribe un mensaje..."
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              disabled={enviando}
            />
            
            <button 
              type="submit" 
              className="mini-send-button"
              disabled={enviando || !nuevoMensaje.trim()}
            >
              {enviando ? (
                <div className="mini-spinner"></div>
              ) : (
                <FaPaperPlane />
              )}
            </button>
          </form>
          <button className="view-full-chat" onClick={navigateToFullChat}>
            Ver chat completo
          </button>
        </div>
      </div>
    )}
    
    <div className="chat-icon-container"
      onClick={handleChatClick}
    >
      <FaComments className="chat-icon" />
      {tieneNotificaciones && (
        <div className="unread-badge"></div>
      )}
    </div>
  </>
);
};

export default FloatingChatButton;