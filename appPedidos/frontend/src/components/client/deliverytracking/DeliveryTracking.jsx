// src/components/client/DeliveryTracking.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import MapComponent from '../../shared/LeafletMapComponent';
import ChatComponent from '../../shared/ChatComponent';
import LocationService from '../../../services/LocationService';
import OrderService from '../../../services/OrderService';
import ApiService from '../../../services/api';
import './DeliveryTracking.css';
import { FaArrowLeft, FaMap, FaComments, FaPhoneAlt, FaStar, FaCheck, FaMotorcycle, FaClock, FaHome } from 'react-icons/fa';

const DeliveryTracking = () => {
  const { pedidoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [pedido, setPedido] = useState(null);
  const [repartidor, setRepartidor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [repartidorLocation, setRepartidorLocation] = useState(null);
  const [statusStep, setStatusStep] = useState(1); // 1: Pendiente, 2: En_Camino, 3: Entregado
  const [locationAttempted, setLocationAttempted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  // Cargar datos del pedido
  useEffect(() => {
    const checkGeolocationPermission = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        if (result.state === 'denied') {
          setPermissionDenied(true);
        }
        result.addEventListener('change', () => {
          setPermissionDenied(result.state === 'denied');
        });
      } catch (error) {
        console.error('Error al verificar permisos:', error);
      }
    };

    checkGeolocationPermission();

    const fetchPedidoData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener información del pedido
        const response = await ApiService.pedidos.detalle(pedidoId);
        
        if (!response.data || !response.data.pedido) {
          throw new Error('No se encontró información del pedido');
        }
        
        const pedidoData = response.data.pedido;
        setPedido(pedidoData);
        
        // Determinar el paso actual según el estado
        switch (pedidoData.estado) {
          case 'Pendiente':
            setStatusStep(1);
            break;
          case 'En_Camino':
            setStatusStep(2);
            break;
          case 'Entregado':
            setStatusStep(3);
            break;
          default:
            setStatusStep(1);
        }
        
        // Si hay repartidor asignado
        if (response.data.repartidor) {
          setRepartidor(response.data.repartidor);
        }
        
        // Obtener ubicación inicial solo si hay repartidor asignado y no lo hemos intentado antes
        if (pedidoData.repartidor_Id && pedidoData.estado === 'En_Camino' && !locationAttempted) {
          try {
            const locationData = await LocationService.getCurrentLocation(pedidoId);
            if (locationData) {
              setRepartidorLocation(locationData);
            } else {
              console.log("Ubicación no disponible, esperando actualizaciones en tiempo real");
            }
          } catch (locationError) {
            console.error("Error al obtener ubicación inicial:", locationError);
          } finally {
            setLocationAttempted(true);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar información del pedido:', error);
        setError('No se pudo cargar la información del pedido. Por favor, intente nuevamente.');
        setLoading(false);
      }
    };
    
    let unsubscribeLocation = () => {};
    
    if (pedidoId) {
      fetchPedidoData();
      
      unsubscribeLocation = LocationService.subscribeToLocationUpdates(
        pedidoId,
        (locationData, error) => {
          if (error) {
            console.error('Error en actualización de ubicación:', error);
            return;
          }
          if (locationData) {
            setRepartidorLocation(locationData);
          }
        }
      );
    }
    
    return () => {
      // Limpiar suscripciones
      if (typeof unsubscribeLocation === 'function') {
        unsubscribeLocation();
      }
    };
  }, [pedidoId, locationAttempted]);
  
  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Volver a la página anterior
  const handleBack = () => {
    navigate(-1);
  };
  
  // Cambiar entre mapa y chat
  const toggleTab = (tab) => {
    setActiveTab(tab);
  };
  
  // Llamar al repartidor
  const callDeliveryPerson = () => {
    if (repartidor && repartidor.telefono) {
      window.location.href = `tel:${repartidor.telefono}`;
    }
  };
  
  // Ir a calificar pedido
  const goToRateOrder = () => {
    navigate(`/cliente/calificar/${pedidoId}`);
  };
  
  if (loading) {
    return (
      <div className="delivery-tracking loading">
        <div className="loading-spinner"></div>
        <p>Cargando información del pedido...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }
  
  if (!pedido) {
    return (
      <div className="error-container">
        <h3>Pedido no encontrado</h3>
        <p>No se pudo encontrar información sobre este pedido.</p>
      </div>
    );
  }
  
  return (
    <div className="delivery-tracking">
      <div className="delivery-tracking-header">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft />
        </button>
        <h2>Seguimiento de Pedido</h2>
      </div>
      
      {permissionDenied && (
        <div className="permission-denied-alert">
          <h3>Permisos de Ubicación Denegados</h3>
          <p>Para ver la ubicación del repartidor, necesitas habilitar los permisos de ubicación en tu navegador.</p>
          <ol>
            <li>Haz clic en el ícono de candado o información en la barra de direcciones</li>
            <li>Busca los permisos de ubicación</li>
            <li>Cambia el permiso a "Permitir"</li>
            <li>Recarga la página</li>
          </ol>
        </div>
      )}

      <div className="delivery-status">
        <div className="status-steps">
          <div className={`status-step ${statusStep >= 1 ? 'active' : ''} ${statusStep > 1 ? 'completed' : ''}`}>
            <div className="step-icon">
              {statusStep > 1 ? <FaCheck /> : <FaClock />}
            </div>
            <span>Preparando</span>
          </div>
          
          <div className="status-connector"></div>
          
          <div className={`status-step ${statusStep >= 2 ? 'active' : ''} ${statusStep > 2 ? 'completed' : ''}`}>
            <div className="step-icon">
              {statusStep > 2 ? <FaCheck /> : <FaMotorcycle />}
            </div>
            <span>En camino</span>
          </div>
          
          <div className="status-connector"></div>
          
          <div className={`status-step ${statusStep >= 3 ? 'active' : ''}`}>
            <div className="step-icon">
              {statusStep >= 3 ? <FaCheck /> : <FaHome />}
            </div>
            <span>Entregado</span>
          </div>
        </div>
      </div>
      
      <div className="order-summary">
        <div className="order-info">
          <div className="order-header">
            <h3>Detalles del Pedido</h3>
            <span className="order-id">#{pedido.id.slice(-6)}</span>
          </div>
          
          <div className="order-details">
            <div className="detail-row">
              <span className="detail-label">Fecha:</span>
              <span className="detail-value">{formatDate(pedido.fechaDeCreacion)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Total:</span>
              <span className="detail-value">{formatPrice(pedido.total)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Estado:</span>
              <span className={`status-badge ${pedido.estado.toLowerCase()}`}>
                {pedido.estado.replace('_', ' ')}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Dirección:</span>
              <span className="detail-value">
                {pedido.direccionEntrega.direccionEspecifica}, {pedido.direccionEntrega.barrio}, 
                Comuna {pedido.direccionEntrega.comuna}
              </span>
            </div>
          </div>
        </div>
        
        {repartidor && (
          <div className="delivery-person-info">
            <h3>Repartidor</h3>
            <div className="delivery-person">
              <div className="delivery-person-avatar">
                {repartidor.nombreCompleto.charAt(0)}
              </div>
              <div className="delivery-person-details">
                <div className="delivery-person-name">{repartidor.nombreCompleto}</div>
                <div className="delivery-person-vehicle">{repartidor.vehiculo || 'Vehículo no especificado'}</div>
              </div>
              <button 
                className="call-button" 
                onClick={callDeliveryPerson} 
                disabled={!repartidor.telefono}
              >
                <FaPhoneAlt />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => toggleTab('map')}
        >
          <FaMap /> Mapa
        </button>
        <button 
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => toggleTab('chat')}
          disabled={!repartidor}
        >
          <FaComments /> Chat
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'map' ? (
          <div className="map-tab">
            <MapComponent 
              pedidoId={pedidoId}
              location={repartidorLocation}
              destination={pedido.direccionEntrega}
              pedido={pedido} // Añadir esta línea
              height={350}
            />
            {!repartidorLocation && (
              <div className="no-location-info">
                <p>La ubicación del repartidor aún no está disponible.</p>
                {pedido.estado === 'Pendiente' && (
                  <p>La ubicación será visible cuando el pedido esté en camino.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="chat-tab">
            {repartidor ? (
              <ChatComponent 
                pedidoId={pedidoId}
                receptorId={repartidor.id}
                receptorNombre={repartidor.nombreCompleto}
              />
            ) : (
              <div className="no-chat-info">
                <p>El chat estará disponible cuando se asigne un repartidor a tu pedido.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {pedido.estado === 'Entregado' && (
        <div className="order-actions">
          <button onClick={goToRateOrder} className="rate-button">
            <FaStar /> Calificar pedido
          </button>
        </div>
      )}
    </div>
  );
};

export default DeliveryTracking;