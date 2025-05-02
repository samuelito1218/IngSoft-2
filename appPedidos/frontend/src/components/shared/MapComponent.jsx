// src/components/shared/MapComponent.jsx
import React, { useEffect, useRef } from 'react';
import '../../styles/Map.css';

function MapComponent({ location, destination, isDelivery = false }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const marker = useRef(null);
  
  // Inicializar Google Maps
  useEffect(() => {
    // Asegúrate de tener la API de Google Maps cargada
    const loadGoogleMaps = () => {
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=TU_API_KEY&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        document.head.appendChild(script);
        return () => {
          document.head.removeChild(script);
        };
      } else {
        initializeMap();
      }
    };
    
    loadGoogleMaps();
  }, []);
  
  // Inicializar mapa
  const initializeMap = () => {
    if (!mapRef.current) return;
    
    // Coordenadas por defecto (puedes usar una ubicación en Colombia)
    const defaultLocation = { lat: 3.45, lng: -76.53 }; // Cali, Colombia
    
    const mapOptions = {
      zoom: 15,
      center: defaultLocation,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true
    };
    
    mapInstance.current = new window.google.maps.Map(
      mapRef.current,
      mapOptions
    );
    
    // Crear marcador para el repartidor
    marker.current = new window.google.maps.Marker({
      position: defaultLocation,
      map: mapInstance.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 8
      }
    });
  };
  
  // Actualizar ubicación del marcador cuando cambia
  useEffect(() => {
    if (!mapInstance.current || !marker.current || !location) return;
    
    const position = new window.google.maps.LatLng(
      location.lat,
      location.lng
    );
    
    marker.current.setPosition(position);
    mapInstance.current.panTo(position);
    
    // Si hay una dirección de destino, mostrar ruta
    if (destination && window.google) {
      showRoute(position, destination);
    }
  }, [location, destination]);
  
  // Mostrar ruta entre origen y destino
  const showRoute = (origin, destination) => {
    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map: mapInstance.current,
      suppressMarkers: true // No mostrar marcadores A y B
    });
    
    // Si destination es un objeto con latitud y longitud
    const destPoint = destination.lat && destination.lng
      ? new window.google.maps.LatLng(destination.lat, destination.lng)
      : destination; // Si es una dirección como texto
    
    directionsService.route(
      {
        origin: origin,
        destination: destPoint,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
        } else {
          console.error('Error al calcular ruta:', status);
        }
      }
    );
  };
  
  return (
    <div className="map-wrapper">
      {!location && (
        <div className="map-placeholder">
          <p>Esperando ubicación...</p>
        </div>
      )}
      <div 
        ref={mapRef} 
        className="map-container"
      ></div>
    </div>
  );
}

export default MapComponent;