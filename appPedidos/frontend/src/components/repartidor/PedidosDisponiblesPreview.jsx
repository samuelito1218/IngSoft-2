import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMotorcycle, FaMapMarkerAlt, FaStore, FaComments } from 'react-icons/fa';
import ApiService from '../../services/api';
import '../../styles/PedidosDisponiblesPreview.css'
import '../../styles/ChatPedido.css'


const PedidosDisponiblesPreview = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tomandoPedido, setTomandoPedido] = useState(false);
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState(null);

  
  const navigate = useNavigate();
  const navigateToChat = (pedidoId) => {
    console.log("Navegando al chat del pedido:", pedidoId);
    navigate(`/repartidor/chat/${pedidoId}`);
  };

  useEffect(() => {
    const fetchPedidosDisponibles = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('http://localhost:5000/api/pedidos/disponibles', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Mostrar solo los 3 primeros pedidos para la vista previa
          setPedidos(Array.isArray(data) ? data.slice(0, 3) : (data.data ? data.data.slice(0, 3) : []));
        } else {
          throw new Error('Error al obtener pedidos disponibles');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar pedidos disponibles:', error);
        setError('No se pudieron cargar los pedidos disponibles');
        setLoading(false);
      }
    };
    
    fetchPedidosDisponibles();
  }, []);
  
  const handleTomarPedido = async (pedidoId) => {
    try {
      setPedidoSeleccionadoId(pedidoId);
      setTomandoPedido(true);
      
      const response = await fetch(`http://localhost:5000/api/pedidos/asignar/${pedidoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        navigate('/repartidor/pedidos-activos');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'No se pudo tomar el pedido. Inténtelo nuevamente.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al tomar pedido:', error);
      alert('Error al tomar el pedido. Por favor, intenta nuevamente.');
    } finally {
      setTomandoPedido(false);
      setPedidoSeleccionadoId(null);
    }
  };
  
  const goToAllPedidos = () => {
    navigate('/repartidor/pedidos-disponibles');
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
        <p>No hay pedidos disponibles en este momento</p>
      </div>
    );
  }

   //Nuevo fragmento

   const formatearDireccion = (dir) => {
    if (!dir) return "Dirección no disponible";
    return `${dir.direccionEspecifica}, ${dir.barrio}, Comuna ${dir.comuna}`;
  };


  return (
    <div className="pedidos-disponibles-preview">
      <div className="preview-grid">
        {pedidos.map((pedido) => (
          <div key={pedido.id} className="pedido-preview-card">
            <div className="pedido-preview-header">
              <div className="restaurante-info">
                <FaStore className="icon-sm" />
                <h4>{pedido.restaurante?.nombre || 'Restaurante'}</h4>
              </div>
            </div>
            
            <div className="pedido-preview-body">
              <div className="info-row-sm">
                <FaMapMarkerAlt className="icon-sm" />
                <div className="location-info-sm">
                  <p className="direccion-text">{formatearDireccion(pedido.direccionEntrega)}</p>
                </div>
              </div>
              
              <div className="info-row-sm distance-row-sm">
                <FaMotorcycle className="icon-sm" />
                <p className="distance-value-sm">{pedido.distanciaEstimada || '3.5'} km</p>
              </div>
            </div>
            
            <div className="pedido-preview-footer">
              <button 
                className="tomar-pedido-btn-sm"
                onClick={() => handleTomarPedido(pedido.id)}
                disabled={tomandoPedido && pedidoSeleccionadoId === pedido.id}
              >
                {tomandoPedido && pedidoSeleccionadoId === pedido.id ? (
                  <>
                    <div className="btn-spinner-sm"></div>
                    <span>Tomando...</span>
                  </>
                ) : (
                  <span>Tomar pedido</span>
                )}
              </button>
              <button className="chat-button"
              onClick={() => navigateToChat(pedido.id)}
              >
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

export default PedidosDisponiblesPreview;