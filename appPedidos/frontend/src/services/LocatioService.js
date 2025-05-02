// src/services/LocationService.js
import { ref, set, onValue } from 'firebase/database';
import { db } from '../firebase/config';
import api from './api';

class LocationService {
  // Actualizar ubicación
  updateLocation = async (pedidoId, { lat, lng, heading }) => {
    try {
      // 1. Enviar al backend
      await api.post(`/api/ubicacion/${pedidoId}`, {
        lat,
        lng,
        heading
      });
      
      // 2. Actualizar en Firebase para tiempo real
      const locationRef = ref(db, `deliveries/${pedidoId}/location`);
      await set(locationRef, {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        heading: heading ? parseFloat(heading) : null,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      throw error;
    }
  };
  
  // Suscribirse a cambios de ubicación
  subscribeToLocation = (pedidoId, callback) => {
    const locationRef = ref(db, `deliveries/${pedidoId}/location`);
    
    return onValue(locationRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      } else {
        callback(null);
      }
    });
  };
}

export default new LocationService();