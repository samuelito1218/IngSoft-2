// src/components/client/MapTest.jssx
import React, { useState, useEffect } from 'react';
import MapComponent from '../shared/LeafletMapComponent';
import { FaMapMarkerAlt, FaCheck, FaTimes } from 'react-icons/fa';
import './MapTest.css';

const MapTest = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [testDestination, setTestDestination] = useState({
    lat: 3.43,
    lng: -76.54
  });
  const [mapWorking, setMapWorking] = useState(null); // null: no probado, true: funciona, false: no funciona
  const [locationEnabled, setLocationEnabled] = useState(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(null);
  const [routeCalculated, setRouteCalculated] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  
  // Comprobar si la API de Google Maps está cargada
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        console.log('✅ Google Maps API cargada correctamente');
        setGoogleMapsLoaded(true);
      } else {
        console.log('❌ Google Maps API no cargada');
        setGoogleMapsLoaded(false);
      }
    };
    
    // Verificar inmediatamente y después de un tiempo para asegurar
    checkGoogleMaps();
    const timeout = setTimeout(checkGoogleMaps, 3000);
    
    return () => clearTimeout(timeout);
  }, []);
  
  // Comprobar si la geolocalización está habilitada
  useEffect(() => {
    if (!navigator.geolocation) {
      console.log('❌ Geolocalización no soportada en este navegador');
      setLocationEnabled(false);
      return;
    }
    
    navigator.permissions.query({ name: 'geolocation' })
      .then(result => {
        if (result.state === 'granted' || result.state === 'prompt') {
          console.log('✅ Permisos de geolocalización disponibles');
          setLocationEnabled(true);
        } else {
          console.log('❌ Permisos de geolocalización denegados');
          setLocationEnabled(false);
        }
      })
      .catch(error => {
        console.error('Error al verificar permisos de geolocalización:', error);
        setLocationEnabled(false);
      });
  }, []);
  
  // Obtener ubicación actual
  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada en este navegador');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        console.log(`✅ Posición obtenida: ${latitude}, ${longitude}`);
        
        setCurrentLocation({
          lat: latitude,
          lng: longitude
        });
      },
      error => {
        console.error('Error al obtener ubicación:', error);
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de geolocalización denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado para obtener ubicación';
            break;
          default:
            errorMessage = 'Error desconocido al obtener ubicación';
        }
        alert(`Error: ${errorMessage}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };
  
  // Iniciar seguimiento de ubicación
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada en este navegador');
      return;
    }
    
    const id = navigator.geolocation.watchPosition(
      position => {
        const { latitude, longitude, heading } = position.coords;
        console.log(`✅ Actualización de posición: ${latitude}, ${longitude}`);
        
        setCurrentLocation({
          lat: latitude,
          lng: longitude,
          heading: heading || 0
        });
        
        // Si hay ruta, marcar como funcionando
        if (currentLocation && testDestination) {
          setMapWorking(true);
          setRouteCalculated(true);
        }
      },
      error => {
        console.error('Error al seguir ubicación:', error);
        setMapWorking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
    
    setWatchId(id);
    setIsTracking(true);
  };
  
  // Detener seguimiento
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  };
  
  // Cambiar destino de prueba
  const changeDestination = () => {
    // Cambiar el destino a una ubicación cercana a la actual
    if (currentLocation) {
      setTestDestination({
        lat: currentLocation.lat + 0.01,
        lng: currentLocation.lng + 0.01
      });
    } else {
      // Destino por defecto (centro de Cali)
      setTestDestination({
        lat: 3.44,
        lng: -76.53
      });
    }
  };
  
  // Ver mensaje de estado
  const getStatusMessage = () => {
    if (mapWorking === null) {
      return 'Prueba no iniciada';
    } else if (mapWorking) {
      return '¡El mapa funciona correctamente!';
    } else {
      return 'Error: El mapa no funciona correctamente';
    }
  };
  
  // Verificar estado general
  const getOverallStatus = () => {
    if (googleMapsLoaded && locationEnabled && currentLocation && routeCalculated) {
      return 'success';
    } else if (googleMapsLoaded === false || locationEnabled === false) {
      return 'error';
    } else {
      return 'warning';
    }
  };
  
  return (
    <div className="map-test">
      <h1>Prueba de Funcionalidad del Mapa</h1>
      
      <div className={`status-card ${getOverallStatus()}`}>
        <h2>Estado: {getStatusMessage()}</h2>
        
        <div className="status-checks">
          <div className={`check-item ${googleMapsLoaded === true ? 'success' : googleMapsLoaded === false ? 'error' : 'pending'}`}>
            {googleMapsLoaded === true ? <FaCheck /> : googleMapsLoaded === false ? <FaTimes /> : '⌛'}
            <span>API de Google Maps</span>
          </div>
          
          <div className={`check-item ${locationEnabled === true ? 'success' : locationEnabled === false ? 'error' : 'pending'}`}>
            {locationEnabled === true ? <FaCheck /> : locationEnabled === false ? <FaTimes /> : '⌛'}
            <span>Permisos de Geolocalización</span>
          </div>
          
          <div className={`check-item ${currentLocation ? 'success' : 'pending'}`}>
            {currentLocation ? <FaCheck /> : '⌛'}
            <span>Ubicación Actual</span>
          </div>
          
          <div className={`check-item ${routeCalculated === true ? 'success' : routeCalculated === false ? 'error' : 'pending'}`}>
            {routeCalculated === true ? <FaCheck /> : routeCalculated === false ? <FaTimes /> : '⌛'}
            <span>Cálculo de Ruta</span>
          </div>
        </div>
      </div>
      
      <div className="map-container">
        <MapComponent 
          location={currentLocation}
          destination={testDestination}
          height={400}
          showControls={true}
          isDelivery={false}
        />
      </div>
      
      <div className="controls">
        <button 
          className="control-button"
          onClick={getCurrentPosition}
          disabled={isTracking}
        >
          <FaMapMarkerAlt />
          Obtener Ubicación Actual
        </button>
        
        <button 
          className={`control-button ${isTracking ? 'active' : ''}`}
          onClick={isTracking ? stopTracking : startTracking}
        >
          {isTracking ? '⏹️ Detener Seguimiento' : '▶️ Iniciar Seguimiento'}
        </button>
        
        <button 
          className="control-button"
          onClick={changeDestination}
        >
          🎯 Cambiar Destino
        </button>
      </div>
      
      <div className="location-info">
        <h3>Información de Ubicación</h3>
        
        <div className="location-grid">
          <div className="location-item">
            <strong>Ubicación Actual:</strong>
            {currentLocation ? (
              <span>
                {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
              </span>
            ) : (
              <span className="no-data">No disponible</span>
            )}
          </div>
          
          <div className="location-item">
            <strong>Destino de Prueba:</strong>
            <span>
              {testDestination.lat.toFixed(6)}, {testDestination.lng.toFixed(6)}
            </span>
          </div>
          
          <div className="location-item">
            <strong>Estado de Seguimiento:</strong>
            <span className={isTracking ? 'active-status' : 'inactive-status'}>
              {isTracking ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="troubleshooting">
        <h3>Solución de Problemas</h3>
        
        <ul>
          <li>Si el mapa no carga, verifica tu conexión a Internet y que la API de Google Maps esté configurada correctamente.</li>
          <li>Si no se obtiene tu ubicación, asegúrate de haber dado permisos de geolocalización en tu navegador.</li>
          <li>Si la ruta no se calcula, comprueba que tanto tu ubicación como el destino son válidos.</li>
          <li>Para un mejor rendimiento, utiliza Chrome o Firefox en su última versión.</li>
        </ul>
      </div>
    </div>
  );
};

export default MapTest;