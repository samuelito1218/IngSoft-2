import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMotorcycle, FaMapMarkerAlt, FaStore, FaMoneyBillWave, FaChevronRight, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import ApiService from '../../services/api';
import '../../styles/PedidosDisponibles.css';
import '../../styles/ChatPedido.css'
import NotificationManager from '../shared/Notification';

const PedidosDisponibles = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tomandoPedido, setTomandoPedido] = useState(false);
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

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
      window.showNotification('Error al cargar pedidos disponibles', 'error');
    }
  };

  // Nuevo método para mostrar la confirmación
  const handleMostrarConfirmacion = (pedido) => {
    setPedidoSeleccionado(pedido);
    setErrorMessage('');
    setShowConfirmModal(true);
  };

  const handleTomarPedido = async () => {
    if(!pedidoSeleccionado) return;
    try {
      setPedidoSeleccionadoId(pedidoSeleccionado.id);
      setTomandoPedido(true);
      setErrorMessage('');
      
      const response = await ApiService.pedidos.tomarPedido(pedidoSeleccionado.id);
      
      if (response.success) {
        // Recargar la lista de pedidos disponibles
        setShowConfirmModal(false);
        fetchPedidosDisponibles();
        
        // Mostrar notificación de éxito
        window.showNotification('Pedido tomado con éxito. Dirígete al restaurante para recogerlo.', 'success');
        
        // Pequeño retraso para que la notificación sea visible
        setTimeout(() => {
          navigate("/repartidor/pedidos-activos");
        }, 1000);
      } else {
        setErrorMessage(response.message || 'No se pudo tomar el pedido. Inténtelo nuevamente.');
        window.showNotification(response.message || 'No se pudo tomar el pedido. Inténtelo nuevamente.', 'error');
      }
      
    } catch (error) {
      console.error('Error al tomar pedido:', error);
      const errorMsg = error.response?.data.message || 'Error al tomar el pedido. Por favor, intenta nuevamente.';
      setErrorMessage(errorMsg);
      window.showNotification(errorMsg, 'error');
    } finally {
      setTomandoPedido(false);
      setPedidoSeleccionadoId(null);
    }
  };

  const handleCerrarModal = () => {
    setShowConfirmModal(false);
    setPedidoSeleccionado(null);
    setErrorMessage('');
    setTomandoPedido(false);
  };

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
      {/* Añadir NotificationManager */}
      <NotificationManager />
      
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
                {/* Eliminado el ID del pedido */}
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
                  onClick={() => handleMostrarConfirmacion(pedido)}
                  disabled={tomandoPedido}
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
                {/* Eliminado el botón de chat */}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal de confirmación */}
      {showConfirmModal && pedidoSeleccionado && (
        <div className='confirmation-modal-overlay'>
          <div className='confirmation-modal'>
            <h2>Confirmar Asignación</h2>

            <div className='modal-pedido-info'>
              <p><strong>Restaurante:</strong> {pedidoSeleccionado.restaurante.nombre}</p>
              <p><strong>Dirección:</strong> {formatearDireccion(pedidoSeleccionado.direccionEntrega)}</p>
              <p><strong>Total:</strong> ${pedidoSeleccionado.total}</p>
            </div>

            <div className="confirmation-question">
              <FaExclamationTriangle className="question-icon" />
              <p>¿Quieres asignarte a este pedido?</p>
            </div>
            
            {errorMessage && (
              <div className="error-message">
                <FaExclamationTriangle />
                <p>{errorMessage}</p>
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={handleCerrarModal}
                disabled={tomandoPedido}
              >
                Cancelar
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleTomarPedido}
                disabled={tomandoPedido}
              >
                {tomandoPedido ? (
                  <>
                    <div className="btn-spinner small"></div>
                    <span>Asignando...</span>
                  </>
                ) : (
                  <>
                    <FaCheck />
                    <span>Confirmar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosDisponibles;