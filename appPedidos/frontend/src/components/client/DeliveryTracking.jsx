// src/components/client/DeliveryTracking.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import LocationService from '../../services/LocationService';
import ChatComponent from '../shared/ChatComponent';
import MapComponent from '../shared/MapComponent';
import '../../styles/DeliveryTracking.css';

function DeliveryTracking() {
  const { pedidoId } = useParams();
  const { user } = useAuth();
  const [pedido, setPedido] = useState(null);
  const [repartidor, setRepartidor] = useState(null);
  const [location, setLocation] = useState(null);
  
  useEffect(() => {
    // Cargar datos del pedido y repartidor
    const loadData = async () => {
      try {
        const pedidoRes = await api.get(`/api/pedidos/${pedidoId}`);
        setPedido(pedidoRes.data);
        
        if (pedidoRes.data.repartidor_Id) {
          const repartidorRes = await api.get(`/api/usuarios/${pedidoRes.data.repartidor_Id}`);
          setRepartidor(repartidorRes.data);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };
    
    loadData();
    
    // Suscribirse a actualizaciones de ubicación
    const unsubscribe = LocationService.subscribeToLocation(pedidoId, (newLocation) => {
      setLocation(newLocation);
    });
    
    return () => unsubscribe();
  }, [pedidoId]);
  
  if (!pedido) {
    return <div className="loading">Cargando...</div>;
  }
  
  return (
    <div className="delivery-tracking">
      <div className="tracking-header">
        <h2>Seguimiento de Pedido #{pedidoId}</h2>
        <div className={`status-badge ${pedido.estado.toLowerCase()}`}>
          {pedido.estado.replace('_', ' ')}
        </div>
      </div>
      
      <div className="tracking-content">
        {repartidor ? (
          <>
            <div className="delivery-info">
              <h3>Información de entrega</h3>
              <p><strong>Repartidor:</strong> {repartidor.nombreCompleto}</p>
              <p><strong>Vehículo:</strong> {repartidor.vehiculo}</p>
              <p><strong>Estado:</strong> {pedido.estado.replace('_', ' ')}</p>
            </div>
            
            <div className="map-section">
              <MapComponent 
                location={location}
                destination={pedido.direccionEntrega}
                isDelivery={false}
              />
            </div>
            
            <div className="chat-section">
              <ChatComponent 
                pedidoId={pedidoId}
                receptorId={repartidor.id}
                receptorNombre={repartidor.nombreCompleto}
              />
            </div>
          </>
        ) : (
          <div className="no-repartidor">
            <p>Aún no hay repartidor asignado a tu pedido</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryTracking;