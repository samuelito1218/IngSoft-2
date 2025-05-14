import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMotorcycle, FaMapMarkerAlt, FaStore, FaMoneyBillWave, FaChevronRight, FaComments } from 'react-icons/fa';
import ApiService from '../../services/api';
import '../../styles/PedidosDisponibles.css';
import '../../styles/ChatPedido.css'


const PedidosDisponibles = () => {
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
    fetchPedidosDisponibles();
    
    // Actualizar periódicamente la lista de pedidos disponibles
    const interval = setInterval(fetchPedidosDisponibles, 30000); // Cada 30 segundos
    
    return () => clearInterval(interval);
  }, []);

  const fetchPedidosDisponibles = async () => {
    try {
      setLoading(true);
      const response = await ApiService.pedidos.disponibles();
      
      if (response.data) {
        setPedidos(response.data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar pedidos disponibles:', error);
      setError('No se pudieron cargar los pedidos disponibles. Por favor, intente nuevamente.');
      setLoading(false);
    }
  };

  const handleTomarPedido = async (pedidoId) => {
    try {
      setPedidoSeleccionadoId(pedidoId);
      setTomandoPedido(true);
      
      const response = await ApiService.pedidos.tomarPedido(pedidoId);
      
      if (response.success) {
        // Recargar la lista de pedidos disponibles
        fetchPedidosDisponibles();
        
        // Mostrar notificación de éxito
        alert('Pedido tomado con éxito. Dirígete al restaurante para recogerlo.');
      } else {
        alert(response.message || 'No se pudo tomar el pedido. Inténtelo nuevamente.');
      }
      
      setTomandoPedido(false);
      setPedidoSeleccionadoId(null);
    } catch (error) {
      console.error('Error al tomar pedido:', error);
      alert('Error al tomar el pedido. Por favor, intenta nuevamente.');
      setTomandoPedido(false);
      setPedidoSeleccionadoId(null);
    }
  };

  //Nuevo fragmento

  const formatearDireccion = (dir) => {
    if (!dir) return "Dirección no disponible";
    return `${dir.direccionEspecifica}, ${dir.barrio}, Comuna ${dir.comuna}`;
  };

  if (loading && pedidos.length === 0) {
    return (
      <div className="pedidos-loading">
        <div className="spinner"></div>
        <p>Cargando pedidos disponibles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pedidos-error">
        <p>{error}</p>
        <button onClick={fetchPedidosDisponibles}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="pedidos-disponibles-container">
      <div className="pedidos-header">
        <h1>Pedidos Disponibles</h1>
        <p>Elige un pedido para entregar</p>
      </div>

      {pedidos.length === 0 ? (
        <div className="empty-pedidos">
          <FaMotorcycle className="empty-icon" />
          <h3>No hay pedidos disponibles en este momento</h3>
          <p>Vuelve más tarde para ver nuevos pedidos disponibles</p>
        </div>
      ) : (
        <div className="pedidos-grid">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="pedido-card">
              <div className="pedido-header">
                <div className="restaurante-info">
                  <FaStore className="icon" />
                  <h3>{pedido.restaurante.nombre}</h3>
                </div>
                <span className="pedido-id">#{pedido.id}</span>
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
                  <FaMoneyBillWave className="icon" />
                  <div className="pago-info">
                    <span className="total-label">Total del pedido:</span>
                    <p className="total-amount">${pedido.total.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="info-row distance-row">
                  <FaMotorcycle className="icon" />
                  <div className="distance-info">
                    <span className="distance-label">Distancia estimada:</span>
                    <p className="distance-value">{pedido.distanciaEstimada || '3.5'} km</p>
                  </div>
                </div>
              </div>
              
              <div className="pedido-footer">
                <button 
                  className="tomar-pedido-btn"
                  onClick={() => handleTomarPedido(pedido.id)}
                  disabled={tomandoPedido && pedidoSeleccionadoId === pedido.id}
                >
                  {tomandoPedido && pedidoSeleccionadoId === pedido.id ? (
                    <>
                      <div className="btn-spinner"></div>
                      <span>Tomando pedido...</span>
                    </>
                  ) : (
                    <>
                      <span>Tomar pedido</span>
                      <FaChevronRight className="arrow-icon" />
                    </>
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
      )}
    </div>
  );
};

export default PedidosDisponibles;