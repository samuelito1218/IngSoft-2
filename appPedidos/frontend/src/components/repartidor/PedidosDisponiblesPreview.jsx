import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMotorcycle, FaMapMarkerAlt, FaStore, FaCheck, FaExclamationTriangle, FaChevronRight } from 'react-icons/fa';
import ApiService from '../../services/api';
import '../../styles/PedidosDisponiblesPreview.css'
import '../../styles/ChatPedido.css'
import NotificationManager from '../shared/Notification';

const PedidosDisponiblesPreview = () => {
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

  // Función para mostrar el modal de confirmación
  const handleMostrarConfirmacion = (pedido) => {
    setPedidoSeleccionado(pedido);
    setErrorMessage('');
    setShowConfirmModal(true);
  };
  
  // Función para cerrar el modal
  const handleCerrarModal = () => {
    setShowConfirmModal(false);
    setPedidoSeleccionado(null);
    setErrorMessage('');
    setTomandoPedido(false);
  };
  
  // Función para tomar pedido después de confirmar
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
        // Mostrar notificación de éxito antes de navegar
        window.showNotification('¡Pedido asignado correctamente!', 'success');
        
        // Cerrar el modal
        setShowConfirmModal(false);
        
        // Breve retraso para permitir que la notificación se muestre antes de la navegación
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

  // Formatear dirección para mostrar
  const formatearDireccion = (dir) => {
    if (!dir) return "Dirección no disponible";
    return `${dir.direccionEspecifica}, ${dir.barrio}, Comuna ${dir.comuna}`;
  };

  return (
    <div className="pedidos-disponibles-preview">
      {/* Agregar el NotificationManager */}
      <NotificationManager />
      
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
                onClick={() => handleMostrarConfirmacion(pedido)}
                disabled={tomandoPedido && pedidoSeleccionadoId === pedido.id}
              >
                {tomandoPedido && pedidoSeleccionadoId === pedido.id ? (
                  <>
                    <div className="btn-spinner-sm"></div>
                    <span>Tomando...</span>
                  </>
                ) : (
                  <>
                    <span>Tomar pedido</span>
                    <FaChevronRight className="arrow-icon-sm" />
                  </>
                )}
              </button>
              {/* Eliminado el botón de chat */}
            </div>
          </div>
        ))}
      </div>

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

export default PedidosDisponiblesPreview;