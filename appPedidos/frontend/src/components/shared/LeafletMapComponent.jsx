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
  FaCheckCircle, 
  FaExclamationTriangle 
} from 'react-icons/fa';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapView({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  
  return null;
}

function RouteLine({ positions }) {
  const map = useMap();
  
  useEffect(() => {
    if (!positions || positions.length < 2) return;
    
    const polyline = L.polyline(positions, {
      color: '#4285F4',
      weight: 5
    }).addTo(map);
    
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
  pedido,
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
  const [retryCount, setRetryCount] = useState(0);
  const watchPositionIdRef = useRef(null);
  const mapRef = useRef(null);
  
  const defaultLocation = { lat: 3.45, lng: -76.53 };
  const mapCenter = currentLocation ? [currentLocation.lat, currentLocation.lng] : [defaultLocation.lat, defaultLocation.lng];
  
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

  useEffect(() => {
    return () => {
      if (watchPositionIdRef.current) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isDelivery) {
      startTracking();
    } else if (pedidoId && !locationAttempted) {
      fetchSavedLocation();
      setLocationAttempted(true);
    }
    
    let unsubscribe = () => {};
    
    if (!isDelivery && pedidoId) {
      unsubscribe = LocationService.subscribeToLocationUpdates(pedidoId, (location, error) => {
        if (error) {
          setLocationError(error);
          return;
        }
        
        if (location) {
          if (pedido?.estado === 'Entregado') {
            location.isDelivered = true;
            location.message = 'Ubicación finalizada. El pedido ha sido entregado.';
          }
          setCurrentLocation(location);
          setLocationError(null);
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
        if (pedido?.estado === 'Entregado') {
          location.isDelivered = true;
          location.message = 'Ubicación finalizada. El pedido ha sido entregado.';
        }
        setCurrentLocation(location);
        updateRouteIfPossible(location);
      }
    } catch (error) {
      console.error("Error al obtener ubicación inicial:", error);
      setLocationError("Error al obtener la ubicación inicial. Se intentará nuevamente.");
    } finally {
      setLocationAttempted(true);
    }
  };

  const updateRouteIfPossible = (currentLoc) => {
    if (!destination || !currentLoc) return;
    
    const destLat = parseFloat(destination.lat) || defaultLocation.lat;
    const destLng = parseFloat(destination.lng) || defaultLocation.lng;
    
    setRoutePositions([
      [currentLoc.lat, currentLoc.lng],
      [destLat, destLng]
    ]);
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('La geolocalización no está disponible en este navegador.');
      return;
    }
    
    setIsTracking(true);
    setLocationError(null);
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    
    watchPositionIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      options
    );
    
    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError,
      options
    );
  };

  const stopTracking = () => {
    if (watchPositionIdRef.current) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
      watchPositionIdRef.current = null;
    }
    setIsTracking(false);
  };

  const handlePositionSuccess = async (position) => {
    const { latitude, longitude, heading } = position.coords;
    
    const locationData = {
      lat: latitude,
      lng: longitude,
      heading: heading || 0,
      timestamp: Date.now()
    };
    
    if (pedido?.estado === 'Entregado') {
      locationData.isDelivered = true;
      locationData.message = 'Ubicación finalizada. El pedido ha sido entregado.';
    }
    
    setCurrentLocation(locationData);
    setLocationError(null);
    updateRouteIfPossible(locationData);
    setRetryCount(0);
    
    if (isDelivery && pedidoId) {
      try {
        await LocationService.updateLocation(pedidoId, locationData, heading);
        
        if (onLocationUpdate) {
          onLocationUpdate(locationData);
        }
      } catch (error) {
        console.error('Error al actualizar ubicación:', error);
        setLocationError('Error al actualizar la ubicación. Reintentando...');
      }
    }
  };

  const handlePositionError = (error) => {
    console.error('Error al obtener ubicación:', error);
    
    let errorMessage;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = `Para ver la ubicación del repartidor, necesitas permitir el acceso a la ubicación en tu navegador. 
        Puedes hacerlo haciendo clic en el ícono de candado en la barra de direcciones.`;
        stopTracking();
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'La información de ubicación no está disponible en este momento.';
        // Reintentar después de un delay si no hemos excedido el límite
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            startTracking();
          }, 5000);
        }
        break;
      case error.TIMEOUT:
        errorMessage = 'La solicitud de ubicación expiró. Reintentando...';
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            startTracking();
          }, 3000);
        }
        break;
      default:
        errorMessage = 'Ocurrió un error al obtener la ubicación.';
    }
    
    setLocationError(errorMessage);
  };

  const centerMap = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.setView([currentLocation.lat, currentLocation.lng], 15);
    }
  };

  return (
    <div className="map-wrapper" style={{ height: height }}>
      {locationError && (
        <div className="location-error">
          <div className="error-message">
            <FaExclamationTriangle className="error-icon" />
            <p>{locationError}</p>
          </div>
          {locationError.includes('permitir el acceso') ? (
            <div className="permission-instructions">
              <ol>
                <li>Haz clic en el ícono de candado en la barra de direcciones</li>
                <li>Encuentra "Ubicación" en el menú</li>
                <li>Selecciona "Permitir"</li>
                <li>Recarga la página</li>
              </ol>
            </div>
          ) : (
            <button 
              onClick={() => { 
                setLocationError(null); 
                setRetryCount(0);
                startTracking(); 
              }}
              className="retry-button"
            >
              Reintentar
            </button>
          )}
        </div>
      )}
      
      {currentLocation?.isDelivered && (
        <div className="delivery-complete-message">
          <div className="success-icon">
            <FaCheckCircle size={30} color="#4CAF50" />
          </div>
          <p>{currentLocation.message}</p>
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
        
        <MapView center={mapCenter} zoom={15} />
        
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
        
        {destination && (
          <Marker 
            position={[
              parseFloat(destination.lat) || defaultLocation.lat, 
              parseFloat(destination.lng) || defaultLocation.lng
            ]} 
            icon={destinationIcon}
          >
            <Popup>
              Destino de entrega
            </Popup>
          </Marker>
        )}
        
        {routePositions && !currentLocation?.isDelivered && (
          <RouteLine positions={routePositions} />
        )}
      </MapContainer>

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