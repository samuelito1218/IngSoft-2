import React, { useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMotorcycle, FaMapMarkerAlt, FaStore, FaMoneyBillWave, FaChevronRight, FaCheck, FaExclamationTriangle, FaStar } from 'react-icons/fa';
import ApiService from '../../services/api';
import pedidoPriorityQueue from '../../utils/PedidoPriorityQueue';
import pedidoCache from '../../utils/PedidoLinkedListCache';
import '../../styles/PedidosDisponibles.css';
import '../../styles/ChatPedido.css'
import NotificationManager from '../shared/Notification';

const PedidosDisponibles = () => {
  const [pedidos, setPedidos] = useState([]);
  const [pedidosOrdenados, setPedidosOrdenados] = useState([]);
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
  
    const interval = setInterval(fetchPedidosDisponibles, 30000); 
    
    return () => clearInterval(interval);
  }, []);

  const fetchPedidosDisponibles = async () => {
    try {
      setLoading(true);
      const response = await ApiService.pedidos.disponibles();
      
      if (response.data) {
        pedidoPriorityQueue.clear();

        response.data.forEach(pedido => {
          pedidoPriorityQueue.enqueue(pedido);
          pedidoCache.put(pedido);
        });

        const pedidosConPrioridad = pedidoPriorityQueue.getAllSorted();
        
        setPedidos(response.data);
        setPedidosOrdenados(pedidosConPrioridad);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar pedidos disponibles:', error);
      setError('No se pudieron cargar los pedidos disponibles. Por favor, intente nuevamente.');
      setLoading(false);
      window.showNotification('Error al cargar pedidos disponibles', 'error');
    }
  };

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
      
      const response = await fetch(`http://localhost:5000/api/pedidos/asignar/${pedidoSeleccionado.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        pedidoPriorityQueue.removeById(pedidoSeleccionado.id);
        pedidoCache.remove(pedidoSeleccionado.id);
      
        window.showNotification('¡Pedido asignado correctamente!', 'success');
        
        setShowConfirmModal(false);

        setTimeout(() => {
          navigate('/repartidor/pedidos-activos');
        }, 1000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'No se pudo tomar el pedido. Inténtelo nuevamente.');
        window.showNotification(errorData.message || 'No se pudo tomar el pedido. Inténtelo nuevamente.', 'error');
      }
    } catch (error) {
      console.error('Error al tomar pedido:', error);
      const errorMsg = 'Error al tomar el pedido. Por favor, intenta nuevamente.';
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


  const getPriorityColor = (precio) => {
    if (precio >= 50) return '#27ae60'; // Verde para pedidos de alto valor
    if (precio >= 25) return '#f39c12'; // Naranja para pedidos de valor medio
    return '#3498db'; // Azul para pedidos de valor bajo
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
      <NotificationManager />
      
      <div className="pedidos-header">
        <h1>Pedidos Disponibles</h1>
        <p>Ordenados por valor del pedido (mayor a menor)</p>
      </div>

      {pedidosOrdenados.length === 0 ? (
        <div className="empty-pedidos">
          <FaMotorcycle className="empty-icon" />
          <h3>No hay pedidos disponibles en este momento</h3>
          <p>Vuelve más tarde para ver nuevos pedidos disponibles</p>
        </div>
      ) : (
        <div className="pedidos-grid">
          {pedidosOrdenados.map((pedido, index) => (
            <div key={pedido.id} className="pedido-card">
              <div className="pedido-header">
                <div className="restaurante-info">
                  <FaStore className="icon" />
                  <h3>{pedido.restaurante.nombre}</h3>
                </div>
                {/* Indicador de prioridad */}
                <div className="priority-indicator">
                  <FaStar 
                    style={{ 
                      color: getPriorityColor(pedido.total),
                      fontSize: '16px'
                    }} 
                  />
                  {index === 0 && <span className="priority-badge">PRIORITARIO</span>}
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
                
                <div className="info-row priority-row">
                  <FaMoneyBillWave className="icon" />
                  <div className="pago-info">
                    <span className="total-label">Total del pedido:</span>
                    <p 
                      className="total-amount"
                      style={{ 
                        color: getPriorityColor(pedido.total),
                        fontWeight: 'bold'
                      }}
                    >
                      ${pedido.total.toFixed(2)}
                    </p>
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
                  className={`tomar-pedido-btn ${index === 0 ? 'priority-btn' : ''}`}
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
                      <span>{index === 0 ? 'Tomar pedido prioritario' : 'Tomar pedido'}</span>
                      <FaChevronRight className="arrow-icon" />
                    </>
                  )}
                </button>
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
                    <p><strong>Restaurante:</strong> {pedidoSeleccionado.restaurante?.nombre}</p>
                    <p><strong>Dirección:</strong> {formatearDireccion(pedidoSeleccionado.direccionEntrega)}</p>
                    {pedidoSeleccionado.total && (
                      <p><strong>Total:</strong> ${pedidoSeleccionado.total}</p>
                    )}
                    <p style={{ color: getPriorityColor(pedidoSeleccionado.total || 0), fontWeight: 'bold' }}>
                      <strong>Prioridad:</strong> {(pedidoSeleccionado.total || 0) >= 50 ? 'Alta' : (pedidoSeleccionado.total || 0) >= 25 ? 'Media' : 'Normal'}
                    </p>
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