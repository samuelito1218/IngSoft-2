import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaArrowLeft, FaMotorcycle, FaUser, FaStore, FaSpinner } from 'react-icons/fa';
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
  const [receptorId, setReceptorId] = useState(null);
  const [receptorNombre, setReceptorNombre] = useState('');
  
  const mensajesContenedor = useRef(null);
  const mensajesFinalRef = useRef(null);
  const intervalRef = useRef(null);

  // Determinar el ID y nombre del receptor basado en el rol del usuario
useEffect(() => {
  if (!pedidoInfo) return;
  
  if (pedidoInfo.pedido && pedidoInfo.pedido.cliente && pedidoInfo.pedido.cliente.nombreCompleto) {
    nombreCliente = pedidoInfo.pedido.cliente.nombreCompleto;
  } else if (pedidoInfo.cliente && pedidoInfo.cliente.nombreCompleto) {
    nombreCliente = pedidoInfo.cliente.nombreCompleto;
  } else if (pedidoInfo.pedido && pedidoInfo.pedido.usuario && pedidoInfo.pedido.usuario.nombreCompleto) {
    nombreCliente = pedidoInfo.pedido.usuario.nombreCompleto;
  } else if (pedidoInfo.usuario && pedidoInfo.usuario.nombreCompleto) {
    nombreCliente = pedidoInfo.usuario.nombreCompleto;
  }
  

  try {
    console.log("Estructura completa del pedido:", pedidoInfo);
    console.log("Usuario actual:", user);
    
    let idReceptor, nombreReceptor;
    
    // El problema es que necesitamos usar el rol y el ID correctamente
    // Si pedidoInfo tiene una estructura anidada
    if (pedidoInfo.pedido) {
      const pedido = pedidoInfo.pedido;
      
      // Si soy repartidor, el receptor es el usuario/cliente
      if (user.id === pedido.repartidor_Id) {
        idReceptor = pedido.usuario_id;
        nombreReceptor = (pedido.cliente && pedido.cliente.nombreCompleto) || 'Cliente';
        console.log("Soy repartidor, enviando al cliente:", idReceptor);
      } 
      // Si soy cliente, el receptor es el repartidor
      else if (user.id === pedido.usuario_id) {
        idReceptor = pedido.repartidor_Id;
        nombreReceptor = (pedido.repartidor && pedido.repartidor.nombreCompleto) || 'Repartidor';
        console.log("Soy cliente, enviando al repartidor:", idReceptor);
      }
      // Si no coincido con ninguno, determinar basado en rol
      else {
        console.log("No coinciden IDs, determinando por rol");
        if (user.rol === 'REPARTIDOR') {
          idReceptor = pedido.usuario_id;
          nombreReceptor = (pedido.cliente && pedido.cliente.nombreCompleto) || 'Cliente';
        } else {
          idReceptor = pedido.repartidor_Id;
          nombreReceptor = (pedido.repartidor && pedido.repartidor.nombreCompleto) || 'Repartidor';
        }
      }
    } 
    // Si la estructura no está anidada
    else {
      // Si soy repartidor, el receptor es el usuario/cliente
      if (user.id === pedidoInfo.repartidor_Id) {
        idReceptor = pedidoInfo.usuario_id;
        nombreReceptor = (pedidoInfo.cliente && pedidoInfo.cliente.nombreCompleto) || 'Cliente';
        console.log("Soy repartidor, enviando al cliente:", idReceptor);
      } 
      // Si soy cliente, el receptor es el repartidor
      else if (user.id === pedidoInfo.usuario_id) {
        idReceptor = pedidoInfo.repartidor_Id;
        nombreReceptor = (pedidoInfo.repartidor && pedidoInfo.repartidor.nombreCompleto) || 'Repartidor';
        console.log("Soy cliente, enviando al repartidor:", idReceptor);
      }
      // Si no coincido con ninguno, determinar basado en rol
      else {
        console.log("No coinciden IDs, determinando por rol");
        if (user.rol === 'REPARTIDOR') {
          idReceptor = pedidoInfo.usuario_id;
          nombreReceptor = (pedidoInfo.cliente && pedidoInfo.cliente.nombreCompleto) || 'Cliente';
        } else {
          idReceptor = pedidoInfo.repartidor_Id;
          nombreReceptor = (pedidoInfo.repartidor && pedidoInfo.repartidor.nombreCompleto) || 'Repartidor';
        }
      }
    }
    
    console.log("ID del receptor identificado:", idReceptor);
    console.log("ID del usuario actual:", user.id);
    console.log("¿Son iguales?", idReceptor === user.id);
    console.log("Nombre del receptor identificado:", nombreReceptor);
    
    // Verificar que no estamos enviando mensajes a nosotros mismos
    if (idReceptor && idReceptor !== user.id) {
      setReceptorId(idReceptor);
      setReceptorNombre(nombreReceptor);
    } else {
      console.warn("Posible error: ID del receptor igual al del emisor:", { idReceptor, userId: user.id });
      
      // SOLUCIÓN ALTERNATIVA:
      // Si pedidoInfo tiene repartidor o cliente como objeto anidado, usar esos IDs
      if (pedidoInfo.repartidor && user.rol !== 'REPARTIDOR') {
        // Si no soy repartidor y hay objeto repartidor, usar su ID
        idReceptor = pedidoInfo.repartidor.id;
        nombreReceptor = pedidoInfo.repartidor.nombreCompleto || 'Repartidor';
        console.log("Usando ID del repartidor como alternativa:", idReceptor);
      } else if (pedidoInfo.cliente && user.rol === 'REPARTIDOR') {
        // Si soy repartidor y hay objeto cliente, usar su ID
        idReceptor = pedidoInfo.cliente.id;
        nombreReceptor = pedidoInfo.cliente.nombreCompleto || 'Cliente';
        console.log("Usando ID del cliente como alternativa:", idReceptor);
      } 
      // SOLUCIÓN DE ÚLTIMO RECURSO:
      // Si nada más funciona, buscar cualquier ID que no sea el nuestro
      else {
        console.log("Buscando cualquier ID que no sea el nuestro");
        
        // Extraer todos los IDs del objeto pedidoInfo
        const extractIds = (obj, path = '') => {
          const ids = [];
          
          if (obj && typeof obj === 'object') {
            Object.entries(obj).forEach(([key, value]) => {
              const newPath = path ? `${path}.${key}` : key;
              
              if ((key === 'id' || key.endsWith('_id') || key.endsWith('Id')) && 
                  typeof value === 'string' && value !== user.id) {
                ids.push({ path: newPath, id: value });
              }
              
              if (value && typeof value === 'object' && !Array.isArray(value)) {
                ids.push(...extractIds(value, newPath));
              }
            });
          }
          
          return ids;
        };
        
        const allIds = extractIds(pedidoInfo);
        console.log("Todos los IDs encontrados:", allIds);
        
        if (allIds.length > 0) {
          // Buscar un ID que sea más probable que sea de un usuario
          const userIdCandidate = allIds.find(item => 
            item.path.includes('usuario') || item.path.includes('cliente') || item.path.includes('repartidor')
          ) || allIds[0];
          
          idReceptor = userIdCandidate.id;
          console.log("Usando ID alternativo desde:", userIdCandidate.path);
        }
      }
      
      if (idReceptor && idReceptor !== user.id) {
        setReceptorId(idReceptor);
        setReceptorNombre(nombreReceptor || 'Usuario');
        console.log("Usando ID del receptor después de verificaciones adicionales:", idReceptor);
      } else {
        console.error("No se pudo determinar un receptor válido diferente al emisor");
      }
    }
  } catch (error) {
    console.error("Error al determinar receptor:", error);
  }
}, [pedidoInfo, user]);

  // Cargar información del pedido y mensajes al montar
  useEffect(() => {
    const cargarDatos = async () => {
      if (!pedidoId) {
        setError('No se especificó un ID de pedido');
        setLoading(false);
        return;
      }
      
      try {
        // Cargar información del pedido
        await fetchPedidoInfo();
        // Cargar mensajes
        await fetchMensajes();
      } catch (err) {
        console.error("Error en cargarDatos:", err);
        setError('Error al cargar la información. Por favor, intenta de nuevo.');
        setLoading(false);
      }
    };
    
    cargarDatos();
    
    // Configurar intervalo para actualizar mensajes periódicamente
    if (pedidoId) {
      intervalRef.current = setInterval(() => {
        fetchMensajes().catch(err => 
          console.error("Error al actualizar mensajes:", err)
        );
      }, 10000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pedidoId]);
  
  // Hacer scroll al último mensaje
  useEffect(() => {
    if (mensajesFinalRef.current) {
      setTimeout(() => {
        mensajesFinalRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [mensajes]);

  const fetchPedidoInfo = async () => {
    try {
      if (!pedidoId) {
        console.error("Intentando fetchPedidoInfo sin pedidoId");
        setError('No se especificó un ID de pedido');
        return null;
      }
      
      console.log("Obteniendo información del pedido:", pedidoId);
      const response = await ApiService.pedidos.detalle(pedidoId);
      console.log("Información del pedido recibida:", response.data);
      
      if (response && response.data) {
        setPedidoInfo(response.data);
        return response.data;
      } else {
        console.error("La respuesta no contiene datos");
        throw new Error('No se pudo obtener información del pedido');
      }
    } catch (error) {
      console.error('Error al obtener información del pedido:', error);
      return null;
    }
  };

  const fetchMensajes = async () => {
    try {
      if (!pedidoId) {
        console.error("Intentando fetchMensajes sin pedidoId");
        return;
      }
      
      console.log("Obteniendo mensajes para pedido:", pedidoId);
      const response = await ApiService.mensajes.obtener(pedidoId);
      console.log("Mensajes recibidos:", response.data);
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          const mensajesProcesados = response.data.map(mensaje => ({
            id: mensaje.id || `temp-${Date.now()}-${Math.random()}`,
            contenido: mensaje.texto || mensaje.contenido || '', 
            fechaCreacion: mensaje.fechaEnvio || mensaje.fechaCreacion || new Date().toISOString(),
            tipoEmisor: mensaje.usuarioEmisor === user.id ? 'REPARTIDOR' : 'CLIENTE',
            leido: mensaje.leido || false
          }));
          
          setMensajes(mensajesProcesados);
        } else {
          console.warn("La respuesta de mensajes no es un array:", response.data);
          setMensajes([]);
        }
      } else {
        console.warn("No hay datos en la respuesta de mensajes");
        setMensajes([]);
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    
    // Validar que tenemos toda la información necesaria
    if (!nuevoMensaje.trim() || !pedidoId || !receptorId || enviando) {
      if (!receptorId) {
        console.error("Falta receptorId para enviar mensaje");
        alert("No se pudo identificar al destinatario");
      }
      return;
    }
    
    try {
      setEnviando(true);
      
      console.log("Enviando mensaje a:", {
        pedidoId,
        receptorId,
        mensaje: nuevoMensaje.trim()
      });
      
      // Agregar mensaje optimista para feedback inmediato
      const mensajeOptimista = {
        id: `temp-${Date.now()}`,
        contenido: nuevoMensaje.trim(),
        fechaCreacion: new Date().toISOString(),
        tipoEmisor: 'REPARTIDOR', // Asumiendo que somos el remitente
        pendiente: true
      };
      
      setMensajes(prev => [...prev, mensajeOptimista]);
      
      // Guardar y limpiar el mensaje
      const mensajeTexto = nuevoMensaje.trim();
      setNuevoMensaje('');
      
      // Enviar al servidor
      const response = await ApiService.mensajes.enviar(
        pedidoId,
        receptorId,
        mensajeTexto
      );
      
      console.log("Respuesta del servidor:", response);
      
      // Recargar mensajes para confirmar
      await fetchMensajes();
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
      
      // Restaurar el mensaje si falló
      setNuevoMensaje(nuevoMensaje.trim());
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
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error("Error formateando fecha:", e);
      return '';
    }
  };

  if (error) {
    return (
      <div className="chat-error">
        <p>{error}</p>
        <button onClick={goBack}>Volver</button>
      </div>
    );
  }

  console.log("VALOR FINAL DE receptorNombre:", receptorNombre);

  return (
  <div className="chat-pedido-container">
    <div className="chat-header">
      <button className="back-button" onClick={goBack}>
        <FaArrowLeft />
      </button>
      
       <div className="chat-info">
        <h2>Chat de Pedido</h2>
        <div className="chat-subtitle">
          {receptorNombre || 'Usuario'}
        </div>
        {pedidoInfo && (
          <div className="chat-details">
            {pedidoInfo.restaurante && (
              <div className="restaurante-info">
                <FaStore className="icon-sm" />
                <span>{pedidoInfo.restaurante.nombre}</span>
              </div>
            )}
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
          <p>No hay mensajes aún.</p>
          <p className="chat-hint">¡Envía el primer mensaje para iniciar la conversación!</p>
        </div>
      ) : (
        <>
          {mensajes.map((mensaje) => (
            <div 
              key={mensaje.id} 
              className={`mensaje ${mensaje.tipoEmisor === 'REPARTIDOR' ? 'enviado' : 'recibido'} ${mensaje.pendiente ? 'pendiente' : ''}`}
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
                  {mensaje.tipoEmisor === 'REPARTIDOR' && mensaje.leido && 
                    <span className="estado-leido">✓</span>
                  }
                </div>
              </div>
            </div>
          ))}
          <div ref={mensajesFinalRef} />
        </>
      )}
    </div>
    
    <form className="chat-input-container" onSubmit={handleEnviarMensaje}>
      <textarea
        className="chat-input"
        placeholder="Escribe un mensaje..."
        value={nuevoMensaje}
        onChange={(e) => setNuevoMensaje(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={enviando || !receptorId}
      />
      
      <button 
        type="submit" 
        className="send-button"
        disabled={enviando || !nuevoMensaje.trim() || !receptorId}
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