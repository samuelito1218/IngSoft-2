// src/services/LocationService.js
import api from './api';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../firebase/config';

class LocationService {
  // Suscribirse a actualizaciones de ubicación en tiempo real
  subscribeToLocation(pedidoId, callback) {
    if (!pedidoId) {
      console.error('pedidoId is required');
      return () => {};
    }
    
    console.log(`Subscribing to location updates for pedido ${pedidoId}`);
    const locationRef = ref(db, `ubicaciones/${pedidoId}`);
    
    const unsubscribe = onValue(locationRef, (snapshot) => {
      if (snapshot.exists()) {
        const locationData = snapshot.val();
        callback(locationData);
      } else {
        console.log('No location data available');
        callback(null);
      }
    }, (error) => {
      console.error('Error in location subscription:', error);
    });
    
    return unsubscribe;
  }
  
  // Para repartidores: actualizar su ubicación
  async updateLocation(pedidoId, locationData) {
    try {
      // 1. Actualizar en el backend
      await api.put(`/ubicacion/pedido/${pedidoId}`, locationData);
      
      // 2. Actualizar en Firebase para tiempo real
      const locationRef = ref(db, `ubicaciones/${pedidoId}`);
      await set(locationRef, {
        ...locationData,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }
}

export default new LocationService();