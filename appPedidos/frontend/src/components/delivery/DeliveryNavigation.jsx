// src/components/delivery/DeliveryNavigation.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import LocationService from '../../services/LocationService';
import ChatComponent from '../shared/ChatComponent';
import MapComponent from '../shared/MapComponent';
import '../../styles/DeliveryNavigation.css';

function DeliveryNavigation() {
  const { pedidoId } = useParams();
  const { user } = useAuth();
  const [pedido, setPedido] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationSharing, setLocationSharing] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // Load order and customer data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log(`Loading data for pedido ${pedidoId}`);
        
        // Get order details
        const pedidoRes = await api.get(`/pedidos/${pedidoId}`);
        setPedido(pedidoRes.data);
        
        // Get customer details
        const clienteRes = await api.get(`/usuarios/${pedidoRes.data.usuario_id}`);
        setCliente(clienteRes.data);
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("No se pudieron cargar los datos del pedido");
        setLoading(false);
      }
    };
    
    if (pedidoId) {
      loadData();
    }
  }, [pedidoId]);
  
  // Clean up location tracking when unmounting
  useEffect(() => {
    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (locationSharing) {
        setLocationSharing(false);
      }
    };
  }, [watchId, locationSharing]);
  
  // Start sharing location
  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización");
      return;
    }
    
    if (!pedidoId) {
      alert("No hay pedido seleccionado");
      return;
    }
    
    // Request permission and start tracking
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading = 0 } = position.coords;
        
        const locationData = {
          lat: latitude,
          lng: longitude,
          heading: heading
        };
        
        // Update state for local display
        setCurrentLocation(locationData);
        
        // Send to service for backend storage and Firebase
        LocationService.updateLocation(pedidoId, locationData)
          .catch(err => console.error("Error updating location:", err));
      },
      (error) => {
        console.error("Error getting location:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            alert("Usuario denegó la solicitud de geolocalización.");
            break;
          case error.POSITION_UNAVAILABLE:
            alert("Información de ubicación no disponible.");
            break;
          case error.TIMEOUT:
            alert("Se agotó el tiempo de espera para obtener la ubicación.");
            break;
          default:
            alert("Error desconocido al obtener ubicación.");
            break;
        }
        setLocationSharing(false);
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 10000, 
        timeout: 10000 
      }
    );
    
    setWatchId(id);
    setLocationSharing(true);
  };
  
  // Stop sharing location
  const stopLocationSharing = () => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setLocationSharing(false);
    }
  };
  
  if (loading) {
    return <div className="loading">Cargando...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  if (!pedido || !cliente) {
    return <div className="error">No se encontraron datos del pedido</div>;
  }
  
  return (
    <div className="delivery-navigation">
      <div className="nav-header">
        <h2>Entrega #{pedidoId}</h2>
        <div className="sharing-toggle">
          <button 
            onClick={locationSharing ? stopLocationSharing : startLocationSharing}
            className={locationSharing ? "btn-stop" : "btn-start"}
          >
            {locationSharing ? "Dejar de compartir ubicación" : "Compartir ubicación"}
          </button>
        </div>
      </div>
      
      <div className="delivery-content">
        <div className="customer-info">
          <h3>Cliente</h3>
          <p><strong>Nombre:</strong> {cliente.nombreCompleto}</p>
          <p><strong>Teléfono:</strong> {cliente.telefono}</p>
          <p><strong>Dirección:</strong> {pedido.direccionEntrega.direccionEspecifica}</p>
          <p><strong>Comuna:</strong> {pedido.direccionEntrega.comuna}</p>
          <p><strong>Barrio:</strong> {pedido.direccionEntrega.barrio}</p>
        </div>
        
        <div className="map-section">
          <MapComponent 
            location={currentLocation}
            destination={pedido.direccionEntrega}
            isDelivery={true}
          />
        </div>
        
        <div className="chat-section">
          <ChatComponent 
            pedidoId={pedidoId}
            receptorId={cliente.id}
            receptorNombre={cliente.nombreCompleto}
          />
        </div>
      </div>
    </div>
  );
}

export default DeliveryNavigation;