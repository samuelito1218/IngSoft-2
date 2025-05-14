import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMotorcycle, FaMapMarkerAlt, FaStore, FaCheckCircle, FaComments } from 'react-icons/fa';
import ApiService from '../../services/api';
import '../../styles/PedidosDisponiblesPreview.css'
import '../../styles/ChatPedido.css'

const PedidosActivosPreview = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState(null);
  
  const navigate = useNavigate();

  const navigateToChat = (pedidoId) => {
    console.log("Navegando al chat del pedido:", pedidoId);
    navigate(`/repartidor/chat/${pedidoId}`);
  };

  // Estados posibles de un pedido
  const estados = {
    PENDIENTE: 'Pendiente',
    PREPARANDO: 'Preparando',
    LISTO: 'Listo para recoger',
    EN_CAMINO: 'En camino',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado'
  };
  
  // Colores de los estados
  const estadoColores = {
    PENDIENTE: 'var(--color-warning)',
    PREPARANDO: 'var(--color-info)',
    LISTO: 'var(--color-info-dark)',
    EN_CAMINO: 'var(--color-primary)',
    ENTREGADO: 'var(--color-success)',
    CANCELADO: 'var(--color-danger)'
  };

  useEffect(() => {
    const fetchPedidosActivos = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('http://localhost:5000/api/pedidos/repartidor/activos', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Mostrar solo los 3 primeros pedidos para la vista previa
          setPedidos(Array.isArray(data) ? data.slice(0, 3) : (data.data ? data.data.slice(0, 3) : []));
        } else {
          throw new Error('Error al obtener pedidos activos');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar pedidos activos:', error);
        setError('No se pudieron cargar tus entregas');
        setLoading(false);
      }
    };
    
    fetchPedidosActivos();
  }, []);
  
  const handleCambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      setPedidoSeleccionadoId(pedidoId);
      setCambiandoEstado(true);
      
      let endpoint;
      if (nuevoEstado === 'EN_CAMINO') {
        endpoint = `/api/pedidos/en-camino/${pedidoId}`;
      } else if (nuevoEstado === 'ENTREGADO') {
        endpoint = `/api/pedidos/entregar/${pedidoId}`;
      } else {
        throw new Error(`Estado no soportado: ${nuevoEstado}`);
      }
      
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        navigate('/repartidor/pedidos-activos');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'No se pudo actualizar el estado del pedido. Inténtelo nuevamente.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al actualizar el estado del pedido. Por favor, intenta nuevamente.');
    } finally {
      setCambiandoEstado(false);
      setPedidoSeleccionadoId(null);
    }
  };
  
  const goToDetail = (pedidoId) => {
    navigate(`/repartidor/pedidos-activos/${pedidoId}`);
  };

  // Determinar qué botones de acción mostrar según el estado actual
  const getAccionesEstado = (pedido) => {
    switch (pedido.estado) {
      case 'LISTO':
        return (
          <button 
            className="action-button-sm pickup-btn-sm" 
            onClick={() => handleCambiarEstado(pedido.id, 'EN_CAMINO')}
            disabled={cambiandoEstado && pedidoSeleccionadoId === pedido.id}
          >
            {cambiandoEstado && pedidoSeleccionadoId === pedido.id ? (
              <div className="btn-spinner-sm"></div>
            ) : (
              <>
                <FaMotorcycle className="icon-sm" />
                <span>Iniciar entrega</span>
              </>
            )}
          </button>
        );
      case 'EN_CAMINO':
        return (
          <button 
            className="action-button-sm deliver-btn-sm" 
            onClick={() => handleCambiarEstado(pedido.id, 'ENTREGADO')}
            disabled={cambiandoEstado && pedidoSeleccionadoId === pedido.id}
          >
            {cambiandoEstado && pedidoSeleccionadoId === pedido.id ? (
              <div className="btn-spinner-sm"></div>
            ) : (
              <>
                <FaCheckCircle className="icon-sm" />
                <span>Entregar</span>
              </>
            )}
          </button>
        );
      case 'PENDIENTE':
      case 'PREPARANDO':
        return (
          <button 
            className="view-detail-btn-sm" 
            onClick={() => goToDetail(pedido.id)}
          >
            <span>Ver detalles</span>
          </button>
        );
      default:
        return (
          <button 
            className="view-detail-btn-sm" 
            onClick={() => goToDetail(pedido.id)}
          >
            <span>Ver detalles</span>
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className="pedidos-preview-loading">
        <div className="spinner-sm"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pedidos-preview-error">
        <p>{error}</p>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="no-pedidos-preview">
        <p>No tienes entregas asignadas</p>
      </div>
    );
  }

   //Nuevo fragmento

   const formatearDireccion = (dir) => {
    if (!dir) return "Dirección no disponible";
    return `${dir.direccionEspecifica}, ${dir.barrio}, Comuna ${dir.comuna}`;
  };

  return (
    <div className="pedidos-activos-preview">
      <div className="preview-grid">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="pedido-preview-card">
            <div className="pedido-preview-header">
              <div className="restaurante-info">
                <FaStore className="icon-sm" />
                <h4>{pedido.restaurante.nombre}</h4>
              </div>
              <div 
                className="estado-badge-sm"
                style={{ backgroundColor: estadoColores[pedido.estado] || 'var(--color-gray)' }}
              >
                {estados[pedido.estado] || pedido.estado}
              </div>
            </div>
            
            <div className="pedido-preview-body">
              <div className="info-row-sm">
                <FaMapMarkerAlt className="icon-sm" />
                <div className="location-info-sm">
                  <p className="direccion-text">{formatearDireccion(pedido.direccionEntrega)}</p>

                </div>
              </div>
            </div>
            
            <div className="pedido-preview-footer">
              {getAccionesEstado(pedido)}
              <button className="chat-button"
              onClick={() => navigateToChat(pedido.id)}>
                <FaComments />
                <span>Chat</span>
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PedidosActivosPreview;