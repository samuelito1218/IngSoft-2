// src/services/LocationService.js
import api from './api';
import { ref, onValue, set, get } from 'firebase/database';
import { db } from '../firebase/config';

class LocationService {
  // Actualizar la ubicación en el backend y Firebase
  async updateLocation(pedidoId, locationData) {
    try {
      // 1. Actualizar en el backend
      await api.put(`/ubicacion/pedido/${pedidoId}`, {
        latitud: locationData.lat,
        longitud: locationData.lng,
        heading: locationData.heading || 0
      });
      
      // 2. Actualizar en Firebase para tiempo real
      const locationRef = ref(db, `deliveries/${pedidoId}/location`);
      await set(locationRef, {
        lat: parseFloat(locationData.lat),
        lng: parseFloat(locationData.lng),
        heading: locationData.heading ? parseFloat(locationData.heading) : 0,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      throw error;
    }
  }
  
  // Suscribirse a cambios de ubicación para un pedido
  subscribeToLocation(pedidoId, callback) {
    if (!pedidoId || typeof callback !== 'function') {
      console.error('Parámetros inválidos para subscribeToLocation');
      return () => {};
    }
    
    try {
      const locationRef = ref(db, `deliveries/${pedidoId}/location`);
      
      const unsubscribe = onValue(locationRef, (snapshot) => {
        if (snapshot.exists()) {
          const locationData = snapshot.val();
          callback(locationData);
        } else {
          callback(null);
        }
      }, (error) => {
        console.error('Error en la suscripción de ubicación:', error);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error al suscribirse a actualizaciones de ubicación:', error);
      return () => {};
    }
  }
  
  // Obtener la última ubicación conocida de un pedido
  async getLastKnownLocation(pedidoId) {
    try {
      // Intentar obtener desde Firebase primero (más actualizado)
      const locationRef = ref(db, `deliveries/${pedidoId}/location`);
      const snapshot = await get(locationRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      
      // Si no está en Firebase, intentar con el backend
      const response = await api.get(`/ubicacion/pedido/${pedidoId}`);
      if (response.data) {
        return {
          lat: parseFloat(response.data.latitud),
          lng: parseFloat(response.data.longitud),
          heading: response.data.heading || 0,
          timestamp: new Date(response.data.fechaActualizacion).getTime()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener última ubicación conocida:', error);
      return null;
    }
  }
}

export default new LocationService();