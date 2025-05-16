// src/components/shared/LeafletMapComponent.jsx
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/Map.css';
import LocationService from '../../services/LocationService';
import { 
  FaLocationArrow, 
  FaMapMarkerAlt, 
  FaStore, 
  FaHome, 
  FaCheckCircle // Añadido FaCheckCircle
} from 'react-icons/fa';

// Corregir problemas de iconos en Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Componente para actualizar la vista del mapa
function MapView({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  
  return null;
}

// Componente para mostrar ruta
function RouteLine({ positions }) {
  const map = useMap();
  
  useEffect(() => {
    if (!positions || positions.length < 2) return;
    
    // Crear la línea para la ruta
    const polyline = L.polyline(positions, {
      color: '#4285F4',
      weight: 5
    }).addTo(map);
    
    // Ajustar mapa para mostrar toda la ruta
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    
    return () => {
      map.removeLayer(polyline);
    };
  }, [map, positions]);
  
  return null;
}

function LeafletMapComponent({ 
  pedidoId, 
  destination, 
  pedido, // Nuevo: recibir el pedido completo
  isDelivery = false, 
  showControls = true,
  height = 350,
  onLocationUpdate = null
}) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routePositions, setRoutePositions] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationAttempted, setLocationAttempted] = useState(false);
  const watchPositionIdRef = useRef(null);
  const mapRef = useRef(null);
  
  // Ubicación predeterminada: Cali, Colombia
  const defaultLocation = { lat: 3.45, lng: -76.53 };
  const mapCenter = currentLocation ? [currentLocation.lat, currentLocation.lng] : [defaultLocation.lat, defaultLocation.lng];
  
  // Iconos personalizados
  const currentLocationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  
  const destinationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  
  // Limpiar recursos cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (watchPositionIdRef.current) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
      }
    };
  }, []);
  
  // Si estamos en modo entrega, iniciar seguimiento
  useEffect(() => {
    if (isDelivery) {
      startTracking();
    } else if (pedidoId && !locationAttempted) {
      // Si tenemos un pedido, obtener ubicación guardada (solo una vez)
      fetchSavedLocation();
      setLocationAttempted(true);
    }
    
    // Suscripción a actualizaciones en tiempo real si no estamos en modo entrega
    let unsubscribe = () => {};
    
    if (!isDelivery && pedidoId) {
      unsubscribe = LocationService.subscribeToLocationUpdates(pedidoId, (location) => {
        if (location) {
          // Si el pedido está entregado, marcar la ubicación como entregada
          if (pedido && pedido.estado === 'Entregado') {
            location.isDelivered = true;
            location.message = 'Ubicación finalizada. El pedido ha sido entregado.';
          }
          
          setCurrentLocation(location);
          updateRouteIfPossible(location);
        }
      });
    }
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isDelivery, pedidoId, locationAttempted, pedido]);
  
  // Obtener ubicación guardada del pedido
  const fetchSavedLocation = async () => {
    if (locationAttempted) return;
    
    try {
      const location = await LocationService.getCurrentLocation(pedidoId);
      if (location) {
        // Si el pedido está entregado, marcar la ubicación como entregada
        if (pedido && pedido.estado === 'Entregado') {
          location.isDelivered = true;
          location.message = 'Ubicación finalizada. El pedido ha sido entregado.';
        }
        
        setCurrentLocation(location);
        updateRouteIfPossible(location);
      }
    } catch (error) {
      console.log("Error al obtener ubicación, se usará la suscripción en tiempo real");
    } finally {
      setLocationAttempted(true);
    }
  };
  
  // Actualizar ruta si tenemos origen y destino
  const updateRouteIfPossible = (currentLoc) => {
    if (!destination) return;
    
    // Extraer lat, lng de la dirección de destino o usar valores por defecto
    const destLat = parseFloat(destination.lat) || 3.45;
    const destLng = parseFloat(destination.lng) || -76.53;
    
    // Para una ruta simple, solo usamos los puntos de inicio y fin
    setRoutePositions([
      [currentLoc.lat, currentLoc.lng],
      [destLat, destLng]
    ]);
  };
  
  // Iniciar seguimiento en tiempo real
  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('La geolocalización no está disponible en este navegador.');
      return;
    }
    
    setIsTracking(true);
    
    // Opciones para el watchPosition
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    
    // Iniciar seguimiento
    watchPositionIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      options
    );
    
    // También hacer una petición inicial
    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError,
      options
    );
  };
  
  // Detener seguimiento
  const stopTracking = () => {
    if (watchPositionIdRef.current) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
      watchPositionIdRef.current = null;
    }
    setIsTracking(false);
  };
  
  // Manejar éxito en obtener posición
  const handlePositionSuccess = async (position) => {
    const { latitude, longitude, heading } = position.coords;
    
    const locationData = {
      lat: latitude,
      lng: longitude,
      heading: heading || 0,
      timestamp: Date.now()
    };
    
    // Si el pedido está entregado, marcar la ubicación como entregada
    if (pedido && pedido.estado === 'Entregado') {
      locationData.isDelivered = true;
      locationData.message = 'Ubicación finalizada. El pedido ha sido entregado.';
    }
    
    setCurrentLocation(locationData);
    updateRouteIfPossible(locationData);
    
    // Si estamos en modo entrega, actualizar en servidor y Firebase
    if (isDelivery && pedidoId) {
      try {
        await LocationService.updateLocation(pedidoId, locationData, heading);
        
        // Notificar al componente padre si es necesario
        if (onLocationUpdate) {
          onLocationUpdate(locationData);
        }
      } catch (error) {
        console.error('Error al actualizar ubicación en servidor:', error);
      }
    }
  };
  
  // Manejar error al obtener posición
  const handlePositionError = (error) => {
    console.error('Error al obtener ubicación:', error);
    
    let errorMessage;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'El usuario denegó la solicitud de geolocalización.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'La información de ubicación no está disponible.';
        break;
      case error.TIMEOUT:
        errorMessage = 'La solicitud de ubicación expiró.';
        break;
      default:
        errorMessage = 'Ocurrió un error desconocido al obtener la ubicación.';
    }
    
    setLocationError(errorMessage);
    stopTracking();
  };
  
  // Centrar mapa en ubicación actual (para el botón de centrar)
  const centerMap = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.setView([currentLocation.lat, currentLocation.lng], 15);
    }
  };
  
  // Estilos CSS para mensajes
  const deliveryCompleteStyle = {
    backgroundColor: '#e8f5e9',
    border: '1px solid #4CAF50',
    borderRadius: '8px',
    padding: '15px',
    margin: '10px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    position: 'absolute',
    top: '10px',
    left: '10px',
    right: '10px',
    zIndex: 1000,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };
  
  const successIconStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
  
  const deliveryMessageStyle = {
    margin: 0,
    color: '#2E7D32',
    fontWeight: '500'
  };
  
  const noLocationStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 1000
  };
  
  return (
    <div className="map-wrapper" style={{ height: `${height}px` }}>
      {locationError && (
        <div className="map-error">
          <p>{locationError}</p>
          <button onClick={() => { setLocationError(null); startTracking(); }}>
            Reintentar
          </button>
        </div>
      )}
      
      {currentLocation && currentLocation.isDelivered && (
        <div style={deliveryCompleteStyle} className="delivery-complete-message">
          <div style={successIconStyle} className="success-icon">
            <FaCheckCircle size={30} color="#4CAF50" />
          </div>
          <p style={deliveryMessageStyle}>{currentLocation.message}</p>
        </div>
      )}
      
      {!currentLocation && !locationError && (
        <div className="map-placeholder">
          <div className="loading-location">
            <div className="pulsating-circle"></div>
            <p>Esperando ubicación...</p>
          </div>
        </div>
      )}
      
      <MapContainer 
        center={mapCenter} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        whenCreated={mapInstance => { mapRef.current = mapInstance; }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Componente para actualizar la vista central */}
        <MapView center={mapCenter} zoom={15} />
        
        {/* Marcador de ubicación actual */}
        {currentLocation && !currentLocation.isDelivered && (
          <Marker 
            position={[currentLocation.lat, currentLocation.lng]} 
            icon={currentLocationIcon}
          >
            <Popup>
              Tu ubicación actual
            </Popup>
          </Marker>
        )}
        
        {/* Marcador de destino */}
        {destination && (
          <Marker 
            position={[
              parseFloat(destination.lat) || 3.45, 
              parseFloat(destination.lng) || -76.53
            ]} 
            icon={destinationIcon}
          >
            <Popup>
              Destino de entrega
            </Popup>
          </Marker>
        )}
        
        {/* Mostrar ruta si tenemos las posiciones */}
        {routePositions && !currentLocation.isDelivered && (
          <RouteLine positions={routePositions} />
        )}
      </MapContainer>
      
      {!currentLocation && !locationError && (
        <div style={noLocationStyle} className="no-location-info">
          <p>La ubicación del repartidor aún no está disponible.</p>
          {pedido && pedido.estado === 'Pendiente' && (
            <p>La ubicación será visible cuando el pedido esté en camino.</p>
          )}
        </div>
      )}
      
      {showControls && (
        <div className="map-controls">
          <button 
            className="map-control-button center-button" 
            onClick={centerMap}
            aria-label="Centrar mapa"
          >
            <FaLocationArrow />
          </button>
          
          {isDelivery && (
            <button 
              className={`map-control-button tracking-button ${isTracking ? 'active' : ''}`}
              onClick={isTracking ? stopTracking : startTracking}
              aria-label={isTracking ? "Detener seguimiento" : "Iniciar seguimiento"}
            >
              {isTracking ? 'Detener' : 'Seguir'}
            </button>
          )}
        </div>
      )}
      
      {currentLocation && destination && !currentLocation.isDelivered && (
        <div className="map-info">
          <div className="location-info">
            <div className="info-item">
              <FaMapMarkerAlt className="info-icon current" />
              <span>Tu ubicación actual</span>
            </div>
            <div className="info-item">
              <FaHome className="info-icon destination" />
              <span>Destino de entrega</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeafletMapComponent;