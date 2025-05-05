// src/components/shared/LeafletMapComponent.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../../styles/Map.css';
import LocationService from '../../services/LocationService';
import { FaLocationArrow, FaMapMarkerAlt, FaStore, FaHome } from 'react-icons/fa';

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
  isDelivery = false, 
  showControls = true,
  height = 350,
  onLocationUpdate = null
}) {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routePositions, setRoutePositions] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
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
    } else if (pedidoId) {
      // Si tenemos un pedido, obtener ubicación guardada
      fetchSavedLocation();
    }
    
    // Suscripción a actualizaciones en tiempo real si no estamos en modo entrega
    if (!isDelivery && pedidoId) {
      const unsubscribe = LocationService.subscribeToLocationUpdates(pedidoId, (location) => {
        if (location) {
          setCurrentLocation(location);
          updateRouteIfPossible(location);
        }
      });
      
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, [isDelivery, pedidoId]);
  
  // Obtener ubicación guardada del pedido
  const fetchSavedLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation(pedidoId);
      if (location) {
        setCurrentLocation(location);
        updateRouteIfPossible(location);
      }
    } catch (error) {
      console.error('Error al obtener ubicación guardada:', error);
    }
  };
  
  // Actualizar ruta si tenemos origen y destino
  const updateRouteIfPossible = (currentLoc) => {
    if (!destination || !destination.lat || !destination.lng) return;
    
    // Para una ruta simple, solo usamos los puntos de inicio y fin
    setRoutePositions([
      [currentLoc.lat, currentLoc.lng],
      [destination.lat, destination.lng]
    ]);
    
    // Para una ruta más avanzada, podrías usar un servicio como OSRM o GraphHopper
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
        {currentLocation && (
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
        {destination && destination.lat && destination.lng && (
          <Marker 
            position={[destination.lat, destination.lng]} 
            icon={destinationIcon}
          >
            <Popup>
              Destino de entrega
            </Popup>
          </Marker>
        )}
        
        {/* Mostrar ruta si tenemos las posiciones */}
        {routePositions && (
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
      
      {currentLocation && destination && (
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