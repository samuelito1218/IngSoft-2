import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaArrowLeft, FaMotorcycle, FaUser, FaStore } from 'react-icons/fa';
import { useAuth } from "../../hooks/useAuth";
import ApiService from '../../services/api';
import '../../styles/ChatPedido.css';

const ChatPedido = () => {
  const { pedidoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [pedidoInfo, setPedidoInfo] = useState(null);
  
  const mensajesContenedor = useRef(null);
  const intervalRef = useRef(null);

  // Cargar información del pedido y mensajes al montar
  useEffect(() => {
    const cargarDatos = async () => {
      await fetchPedidoInfo();
      await fetchMensajes();
    };
    
    cargarDatos();
    
    // Configurar intervalo para actualizar mensajes periódicamente
    intervalRef.current = setInterval(fetchMensajes, 10000); // Cada 10 segundos
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pedidoId]);
  
  // Hacer scroll al último mensaje cuando se carguen o añadan mensajes
  useEffect(() => {
    if (mensajesContenedor.current) {
      mensajesContenedor.current.scrollTop = mensajesContenedor.current.scrollHeight;
    }
  }, [mensajes]);

  const fetchPedidoInfo = async () => {
    try {
      const response = await ApiService.pedidos.detalle(pedidoId);
      console.log("Información del pedido:", response.data);
      
      if (response.data) {
        setPedidoInfo(response.data);
      } else {
        throw new Error('No se pudo obtener información del pedido');
      }
    } catch (error) {
      console.error('Error al obtener información del pedido:', error);
      setError('No se pudo obtener información del pedido.');
    }
  };

  const fetchMensajes = async () => {
    try {
      if (!pedidoId) return;
      
      const response = await ApiService.mensajes.obtener(pedidoId);
      console.log("Mensajes obtenidos:", response.data);
      
      if (response.data) {
        // Procesar mensajes para adaptarlos al formato esperado en la UI
        const mensajesProcesados = Array.isArray(response.data) ? response.data.map(mensaje => ({
          id: mensaje.id,
          contenido: mensaje.texto || mensaje.contenido, 
          fechaCreacion: mensaje.fechaEnvio || mensaje.fechaCreacion,
          tipoEmisor: mensaje.usuarioEmisor === user.id ? 'REPARTIDOR' : 'CLIENTE'
        })) : [];
        
        setMensajes(mensajesProcesados);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
      setError('No se pudieron cargar los mensajes. Intente nuevamente.');
      setLoading(false);
    }
  };

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    
    if (!nuevoMensaje.trim() || !pedidoInfo) return;
    
    try {
      setEnviando(true);
      
      // Determinar el receptor basándose en el rol del usuario actual
      const usuarioReceptorId = pedidoInfo.cliente?.id || pedidoInfo.usuario_id;
      
      console.log("Enviando mensaje a:", usuarioReceptorId, "desde:", user.id);
      
      await ApiService.mensajes.enviar(
        pedidoId,
        nuevoMensaje.trim(),
        usuarioReceptorId
      );
      
      setNuevoMensaje('');
      await fetchMensajes(); // Recargar mensajes después de enviar
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error al enviar el mensaje. Por favor, intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensaje(e);
    }
  };
  
  const goBack = () => {
    navigate(-1);
  };
  
  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '';
    const fecha = new Date(fechaStr);
    return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (error) {
    return (
      <div className="chat-error">
        <p>{error}</p>
        <button onClick={goBack}>Volver</button>
      </div>
    );
  }

  return (
    <div className="chat-pedido-container">
      <div className="chat-header">
        <button className="back-button" onClick={goBack}>
          <FaArrowLeft />
        </button>
        
        <div className="chat-info">
          <h2>Chat de Pedido</h2>
          {pedidoInfo && (
            <div className="chat-details">
              {pedidoInfo.restaurante && (
                <div className="restaurante-info">
                  <FaStore className="icon-sm" />
                  <span>{pedidoInfo.restaurante.nombre}</span>
                </div>
              )}
              <div className="cliente-info">
                <FaUser className="icon-sm" />
                <span>{pedidoInfo.cliente?.nombreCompleto || 'Cliente'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="chat-mensajes" ref={mensajesContenedor}>
        {loading && mensajes.length === 0 ? (
          <div className="chat-loading">
            <div className="spinner"></div>
            <p>Cargando mensajes...</p>
          </div>
        ) : mensajes.length === 0 ? (
          <div className="chat-empty">
            <p>No hay mensajes aún. ¡Envía el primer mensaje!</p>
          </div>
        ) : (
          mensajes.map((mensaje) => (
            <div 
              key={mensaje.id} 
              className={`mensaje ${mensaje.tipoEmisor === 'REPARTIDOR' ? 'enviado' : 'recibido'}`}
            >
              <div className="mensaje-avatar">
                {mensaje.tipoEmisor === 'REPARTIDOR' ? (
                  <FaMotorcycle />
                ) : (
                  <FaUser />
                )}
              </div>
              
              <div className="mensaje-contenido">
                <div className="mensaje-texto">
                  {mensaje.contenido}
                </div>
                <div className="mensaje-hora">
                  {formatFecha(mensaje.fechaCreacion)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <form className="chat-input-container" onSubmit={handleEnviarMensaje}>
        <textarea
          className="chat-input"
          placeholder="Escribe un mensaje..."
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={enviando || !pedidoInfo}
        />
        
        <button 
          type="submit" 
          className="send-button"
          disabled={enviando || !nuevoMensaje.trim() || !pedidoInfo}
        >
          {enviando ? (
            <div className="btn-spinner"></div>
          ) : (
            <FaPaperPlane />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatPedido;