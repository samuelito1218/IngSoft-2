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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load order and delivery person data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log(`Loading data for pedido ${pedidoId}`);
        
        // Get order details
        const pedidoRes = await api.get(`/pedidos/${pedidoId}`);
        setPedido(pedidoRes.data);
        
        // If order has a delivery person assigned, get their details
        if (pedidoRes.data.repartidor_Id) {
          const repartidorRes = await api.get(`/usuarios/${pedidoRes.data.repartidor_Id}`);
          setRepartidor(repartidorRes.data);
        }
        
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
  
  // Subscribe to location updates
  useEffect(() => {
    if (!pedidoId) return;
    
    console.log(`Subscribing to location updates for pedido ${pedidoId}`);
    
    // Subscribe to location updates from Firebase
    const unsubscribe = LocationService.subscribeToLocation(pedidoId, (newLocation) => {
      console.log('Received location update:', newLocation);
      setLocation(newLocation);
    });
    
    // Clean up subscription when unmounting
    return () => {
      console.log('Unsubscribing from location updates');
      unsubscribe();
    };
  }, [pedidoId]);
  
  if (loading) {
    return <div className="loading">Cargando...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  if (!pedido) {
    return <div className="error">No se encontró el pedido</div>;
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
              <p><strong>Tu dirección:</strong> {pedido.direccionEntrega.direccionEspecifica}, {pedido.direccionEntrega.barrio}, Comuna {pedido.direccionEntrega.comuna}</p>
            </div>
            
            <div className="map-section">
              <MapComponent 
                location={location}
                destination={pedido.direccionEntrega}
                isDelivery={false}
              />
              {!location && <p className="location-status">El repartidor aún no ha compartido su ubicación</p>}
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
            <p>Cuando un repartidor acepte tu pedido, podrás ver su ubicación en tiempo real y chatear con él.</p>
            
            <div className="order-details">
              <h3>Detalles del pedido</h3>
              <p><strong>Estado:</strong> {pedido.estado.replace('_', ' ')}</p>
              <p><strong>Dirección de entrega:</strong> {pedido.direccionEntrega.direccionEspecifica}</p>
              <p><strong>Barrio:</strong> {pedido.direccionEntrega.barrio}</p>
              <p><strong>Comuna:</strong> {pedido.direccionEntrega.comuna}</p>
              <p><strong>Total:</strong> ${pedido.total.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryTracking;