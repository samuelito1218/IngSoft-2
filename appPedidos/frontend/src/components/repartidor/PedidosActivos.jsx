import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaMotorcycle, FaMapMarkerAlt, FaStore, FaUser, 
  FaPhoneAlt, FaCheckCircle, FaTimesCircle, FaComments
} from 'react-icons/fa';
import ApiService from '../../services/api';
import '../../styles/PedidosActivos.css';
import '../../styles/ChatPedido.css';
import NotificationManager from '../shared/Notification';

const PedidosActivos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState(null);
  
  const navigate = useNavigate();

  const estados = {
    PENDIENTE: '#f7dc6f',
    EN_CAMINO: '#3498db',
    ENTREGADO: '#27ae60',
    CANCELADO: '#e74c3c',
  };

  const estadoColores = {
    PENDIENTE: 'black',
    EN_CAMINO: 'white',
    ENTREGADO: 'white',
    CANCELADO: 'white',
  };

  useEffect(() => {
    fetchPedidosActivos();
    
    const interval = setInterval(fetchPedidosActivos, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPedidosActivos = async () => {
    try {
      setLoading(true);
      const response = await ApiService.pedidos.repartidorActivos();
      
      if (response.data) {
        setPedidos(response.data);
      }
      
      setLoading(false);
    } catch (error) {
      setError('No se pudieron cargar tus pedidos activos. Por favor, intente nuevamente.');
      setLoading(false);
      window.showNotification('Error al cargar pedidos activos', 'error');
    }
  };

  const hayPedidoEnCamino = () => {
    return pedidos.some(pedido => 
      pedido.estado === 'EN_CAMINO' || pedido.estado.toLowerCase() === 'en_camino' || pedido.estado.toLowerCase() === 'en camino'
    );
  };

  const handleCambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      if (nuevoEstado === 'En_Camino' && hayPedidoEnCamino()) {
        window.showNotification('No puedes iniciar otra entrega mientras tienes un pedido en camino', 'warning');
        return;
      }

      setPedidoSeleccionadoId(pedidoId);
      setCambiandoEstado(true);

      let response;

      if (nuevoEstado === 'En_Camino') {
        response = await ApiService.pedidos.actualizarEstado(pedidoId, 'EN_CAMINO');
      } else if (nuevoEstado === 'Entregado') {
        response = await ApiService.pedidos.actualizarEstado(pedidoId, 'ENTREGADO');
      } else {
        window.showNotification("Estado no válido para este flujo", 'warning');
        setCambiandoEstado(false);
        return;
      }

      if (response.status === 200) {
        window.showNotification(response.data.message || "Estado actualizado correctamente", 'success');
        await fetchPedidosActivos();
      } else {
        window.showNotification(response.message || 'No se pudo actualizar el estado del pedido. Inténtelo nuevamente.', 'error');
      }

    } catch (error) {
      window.showNotification('Error al actualizar el estado del pedido. Por favor, intenta nuevamente.', 'error');
    } finally {
      setCambiandoEstado(false);
      setPedidoSeleccionadoId(null);
    }
  };

  const navigateToChat = (pedidoId) => {
    navigate(`/repartidor/chat/${pedidoId}`);
  };

  const obtenerDatosPedido = (pedido) => {
    return {
      restaurante: {
        nombre: pedido.restaurante?.nombre || 'Restaurante no disponible',
        direccion: pedido.restaurante?.direccion || 
                  pedido.restaurante?.sucursal?.direccion || 
                  'Dirección no disponible',
        imageUrl: pedido.restaurante?.imageUrl || null
      },
      cliente: {
        nombreCompleto: pedido.cliente?.nombreCompleto || 'Cliente no disponible',
        telefono: pedido.cliente?.telefono || 'No disponible'
      }
    };
  };

  const puedeIniciarEntrega = (pedido) => {
    const estadoActual = pedido.estado.toLowerCase();
    
    if (estadoActual === 'pendiente') {
      return !hayPedidoEnCamino();
    }
    
    return false;
  };

  const getAccionesEstado = (pedido) => {
    const estado = pedido.estado.toLowerCase();
    const enCamino = hayPedidoEnCamino();
    const estePedidoEnCamino = estado === 'en_camino' || estado === 'en camino';

    switch (estado) {
      case 'pendiente':
        return (
          <button 
            className={`pickup-btn ${enCamino ? 'disabled' : ''}`}
            onClick={() => handleCambiarEstado(pedido.id, 'En_Camino')}
            disabled={cambiandoEstado || enCamino}
            title={enCamino ? 'No puedes iniciar otra entrega mientras tienes un pedido en camino' : 'Iniciar entrega'}
          >
            {cambiandoEstado && pedidoSeleccionadoId === pedido.id ? (
              <div className="btn-spinner"></div>
            ) : (
              <>
                <FaMotorcycle />
                <span>Iniciar entrega</span>
              </>
            )}
          </button>
        );
      case 'en_camino':
      case 'en camino':
        return (
          <button 
            className="deliver-btn" 
            onClick={() => handleCambiarEstado(pedido.id, 'Entregado')}
            disabled={cambiandoEstado && pedidoSeleccionadoId === pedido.id}
          >
            {cambiandoEstado && pedidoSeleccionadoId === pedido.id ? (
              <div className="btn-spinner"></div>
            ) : (
              <>
                <FaCheckCircle />
                <span>Confirmar entrega</span>
              </>
            )}
          </button>
        );
      case 'entregado':
        return (
          <div className="mensaje-estado entregado">
            <p>Pedido entregado</p>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading && pedidos.length === 0) {
    return (
      <div className="pedidos-loading">
        <div className="spinner"></div>
        <p>Cargando tus entregas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pedidos-error">
        <p>{error}</p>
        <button onClick={fetchPedidosActivos}>Reintentar</button>
      </div>
    );
  }

  const formatearDireccion = (dir) => {
    if (!dir) return "Dirección no disponible";
    return `${dir.direccionEspecifica}, ${dir.barrio}, Comuna ${dir.comuna}`;
  };

  return (
    <div className="pedidos-activos-container">
      <NotificationManager />
      
      <div className="pedidos-header">
        <h1>Mis Entregas</h1>
        <p>Pedidos que tienes asignados</p>
        {hayPedidoEnCamino() && (
          <div className="warning-banner">
            <p>⚠️ Tienes un pedido en camino. Complétalo antes de iniciar otra entrega.</p>
          </div>
        )}
      </div>

      {pedidos.length === 0 ? (
        <div className="empty-pedidos">
          <FaMotorcycle className="empty-icon" />
          <h3>No tienes entregas asignadas</h3>
          <p>Dirígete a la sección de pedidos disponibles para tomar uno</p>
        </div>
      ) : (
        <div className="pedidos-activos-grid">
          {pedidos.map((pedido) => {
            const datosPedido = obtenerDatosPedido(pedido);
            
            return (
              <div key={pedido.id} className="pedido-activo-card">
                <div className="pedido-header">
                  <div className="restaurante-info">
                    <FaStore className="icon" />
                    <h3>{datosPedido.restaurante.nombre}</h3>
                  </div>
                  <div 
                    className="estado-badge"
                    style={{ 
                      backgroundColor: estados[pedido.estado] || 'var(--color-gray)',
                      color: estadoColores[pedido.estado] || 'black'
                    }}
                  >
                    {pedido.estado}
                  </div>
                </div>
                
                <div className="pedido-body">
                  <div className="info-row restaurante-pickup">
                    <FaStore className="icon" />
                    <div className="location-info">
                      <span className="direccion-label">Recoger en:</span>
                      <p className="direccion-text">{datosPedido.restaurante.direccion}</p>
                    </div>
                  </div>
                  
                  <div className="info-row">
                    <FaMapMarkerAlt className="icon" />
                    <div className="location-info">
                      <span className="direccion-label">Entregar en:</span>
                      <p className="direccion-text">{formatearDireccion(pedido.direccionEntrega)}</p>
                    </div>
                  </div>
                  
                  <div className="info-row">
                    <FaUser className="icon" />
                    <div className="cliente-info">
                      <span className="cliente-label">Cliente:</span>
                      <p className="cliente-name">{datosPedido.cliente.nombreCompleto}</p>
                    </div>
                  </div>
                  
                  <div className="info-row">
                    <FaPhoneAlt className="icon" />
                    <div className="telefono-info">
                      <span className="telefono-label">Teléfono:</span>
                      <p className="telefono-number">{datosPedido.cliente.telefono}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pedido-footer">
                  <div className="action-buttons">
                    {getAccionesEstado(pedido)}
                    
                    <button
                      className="chat-button"
                      onClick={() => navigateToChat(pedido.id)}
                    >
                      <FaComments />
                      <span>Chat</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PedidosActivos;