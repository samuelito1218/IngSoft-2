import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaMotorcycle, FaMapMarkerAlt, FaStore, FaUser, 
  FaPhoneAlt, FaCheckCircle, FaTimesCircle, FaComments
} from 'react-icons/fa';
import ApiService from '../../services/api';
import '../../styles/PedidosActivos.css';
import '../../styles/ChatPedido.css'

const PedidosActivos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState(null);
  
  const navigate = useNavigate();

  // Estados posibles de un pedido
  const estados = {
  PENDIENTE: '#f7dc6f',    // amarillo claro
  EN_CAMINO: '#3498db',    // azul oscuro
  ENTREGADO: '#27ae60',    // verde oscuro
  CANCELADO: '#e74c3c',    // rojo
};

const estadoColores = {
  PENDIENTE: 'black',  // para amarillo claro, texto negro
  EN_CAMINO: 'white',
  ENTREGADO: 'white',
  CANCELADO: 'white',
};


  useEffect(() => {
    fetchPedidosActivos();
    
    // Actualizar periódicamente los pedidos activos
    const interval = setInterval(fetchPedidosActivos, 30000); // Cada 30 segundos
    
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
      console.error('Error al cargar pedidos activos:', error);
      setError('No se pudieron cargar tus pedidos activos. Por favor, intente nuevamente.');
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (pedidoId, nuevoEstado) => {
  try {
    setPedidoSeleccionadoId(pedidoId);
    setCambiandoEstado(true);

    let response;

    if (nuevoEstado === 'En_Camino') {
      response = await ApiService.pedidos.actualizarEstado(pedidoId, 'EN_CAMINO');
    } else if (nuevoEstado === 'Entregado') {
      response = await ApiService.pedidos.actualizarEstado(pedidoId, 'ENTREGADO');
    } else {
      alert("Estado no válido para este flujo");
      setCambiandoEstado(false);
      return;
    }

    if (response.status === 200) {
      alert(response.data.message || "Estado actualizado correctamente");
      await fetchPedidosActivos();
    } else {
      alert(response.message || 'No se pudo actualizar el estado del pedido. Inténtelo nuevamente.');
    }

  } catch (error) {
    console.error('Error al cambiar estado:', error);
    alert('Error al actualizar el estado del pedido. Por favor, intenta nuevamente.');
  } finally {
    setCambiandoEstado(false);
    setPedidoSeleccionadoId(null);
  }
};

  
  const navigateToChat = (pedidoId) => {
    navigate(`/repartidor/chat/${pedidoId}`);
  };

  // Determinar qué botones de acción mostrar según el estado actual
  const getAccionesEstado = (pedido) => {
  const estado = pedido.estado.toLowerCase();

  switch (estado) {
    case 'pendiente':
      return (
        <button 
          className="action-button pickup-btn" 
          onClick={() => handleCambiarEstado(pedido.id, 'En_Camino')}
          disabled={cambiandoEstado && pedidoSeleccionadoId === pedido.id}
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
    case 'en camino': // Por si viene con espacio
      return (
        <button 
          className="action-button deliver-btn" 
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

  //Nuevo fragmento

  const formatearDireccion = (dir) => {
    if (!dir) return "Dirección no disponible";
    return `${dir.direccionEspecifica}, ${dir.barrio}, Comuna ${dir.comuna}`;
  };

  

  return (
    <div className="pedidos-activos-container">
      <div className="pedidos-header">
        <h1>Mis Entregas</h1>
        <p>Pedidos que tienes asignados</p>
      </div>

      {pedidos.length === 0 ? (
        <div className="empty-pedidos">
          <FaMotorcycle className="empty-icon" />
          <h3>No tienes entregas asignadas</h3>
          <p>Dirígete a la sección de pedidos disponibles para tomar uno</p>
        </div>
      ) : (
        <div className="pedidos-activos-grid">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="pedido-activo-card">
              <div className="pedido-header">
                <div className="restaurante-info">
                  <FaStore className="icon" />
                  <h3>{pedido.restaurante.nombre}</h3>
                </div>
                <div 
                  className="estado-badge"
                  style={{ backgroundColor: estadoColores[pedido.estado] || 'var(--color-gray)',
                    color: estadoColores[pedido.estado] || 'black'
                   }}
                >
                  {estados[pedido.estado] || pedido.estado}
                </div>
              </div>
              
              <div className="pedido-body">
                <div className="info-row">
                  <FaMapMarkerAlt className="icon" />
                  <div className="location-info">
                    <span className="direccion-label">Dirección de entrega:</span>
                    <p className="direccion-text">{formatearDireccion(pedido.direccionEntrega)}</p>
                  </div>
                </div>
                
                <div className="info-row">
                  <FaUser className="icon" />
                  <div className="cliente-info">
                    <span className="cliente-label">Cliente:</span>
                    <p className="cliente-name">{pedido.cliente.nombreCompleto}</p>
                  </div>
                </div>
                
                <div className="info-row">
                  <FaPhoneAlt className="icon" />
                  <div className="telefono-info">
                    <span className="telefono-label">Teléfono:</span>
                    <p className="telefono-number">{pedido.cliente.telefono || 'No disponible'}</p>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default PedidosActivos;