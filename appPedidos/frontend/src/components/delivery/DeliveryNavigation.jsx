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
  const [locationSharing, setLocationSharing] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  useEffect(() => {
    // Cargar datos del pedido y cliente
    const loadData = async () => {
      try {
        const pedidoRes = await api.get(`/api/pedidos/${pedidoId}`);
        setPedido(pedidoRes.data);
        
        const clienteRes = await api.get(`/api/usuarios/${pedidoRes.data.usuario_id}`);
        setCliente(clienteRes.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };
    
    loadData();
    
    // Limpiar al desmontar
    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [pedidoId]);
  
  // Iniciar compartir ubicación
  const startLocationSharing = () => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const heading = position.coords.heading || 0;
          
          const locationData = {
            lat: latitude,
            lng: longitude,
            heading
          };
          
          // Actualizar estado local
          setCurrentLocation(locationData);
          
          // Enviar ubicación
          LocationService.updateLocation(pedidoId, locationData);
        },
        (error) => console.error("Error de ubicación:", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
      
      setWatchId(id);
      setLocationSharing(true);
    } else {
      alert("Tu navegador no soporta geolocalización");
    }
  };
  
  // Detener compartir ubicación
  const stopLocationSharing = () => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setLocationSharing(false);
    }
  };
  
  if (!pedido || !cliente) {
    return <div className="loading">Cargando...</div>;
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