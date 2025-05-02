// src/components/shared/MapComponent.jsx
import React, { useEffect, useRef, useState } from 'react';
import '../../styles/Map.css';

function MapComponent({ location, destination, isDelivery = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Load Google Maps API
  useEffect(() => {
    // Check if the Google Maps API is already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      return;
    }
    
    // If not loaded, create and load the script
    const loadGoogleMaps = () => {
      const script = document.createElement('script');
      // Replace YOUR_API_KEY with your actual Google Maps API key
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBK5LREFVqRD5QBOYBXEXikr6uBB7UiAgQ&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };
    
    loadGoogleMaps();
    
    return () => {
      // Clean up if needed
    };
  }, []);
  
  // Initialize map once loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    console.log('Initializing map');
    
    // Default to Cali, Colombia
    const defaultLocation = { lat: 3.45, lng: -76.53 };
    
    const mapOptions = {
      zoom: 15,
      center: defaultLocation,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      zoomControl: true
    };
    
    // Create map
    mapInstanceRef.current = new window.google.maps.Map(
      mapRef.current,
      mapOptions
    );
    
    // Create marker for delivery person
    markerRef.current = new window.google.maps.Marker({
      position: defaultLocation,
      map: mapInstanceRef.current,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 8
      }
    });
    
    // Create directions renderer
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      suppressMarkers: true
    });
    
    // If we already have a location, update the map
    if (location) {
      updateMapWithLocation(location);
    }
  }, [mapLoaded]);
  
  // Update marker and map when location changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !markerRef.current || !location) return;
    
    updateMapWithLocation(location);
  }, [location, mapLoaded]);
  
  // Function to update map when location changes
  const updateMapWithLocation = (loc) => {
    console.log('Updating map with location:', loc);
    
    const position = new window.google.maps.LatLng(
      loc.lat,
      loc.lng
    );
    
    // Update marker position
    markerRef.current.setPosition(position);
    
    // Center map on new position
    mapInstanceRef.current.panTo(position);
    
    // If there's a destination and we're not already calculating route, show route
    if (destination && directionsRendererRef.current) {
      showRoute(position, destination);
    }
  };
  
  // Function to calculate and show route
  const showRoute = (origin, dest) => {
    console.log('Calculating route');
    
    const directionsService = new window.google.maps.DirectionsService();
    
    // If destination is a coordinate object
    let destinationPoint;
    if (dest.lat && dest.lng) {
      destinationPoint = new window.google.maps.LatLng(dest.lat, dest.lng);
    } 
    // If destination is just text address, use geocoding
    else if (dest.direccionEspecifica) {
      destinationPoint = dest.direccionEspecifica;
      if (dest.barrio) {
        destinationPoint += `, ${dest.barrio}`;
      }
      if (dest.comuna) {
        destinationPoint += `, comuna ${dest.comuna}`;
      }
      destinationPoint += ', Cali, Colombia';
    } else {
      destinationPoint = dest;
    }
    
    directionsService.route(
      {
        origin: origin,
        destination: destinationPoint,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (response, status) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(response);
          console.log('Route calculated successfully');
        } else {
          console.error('Error calculating route:', status);
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