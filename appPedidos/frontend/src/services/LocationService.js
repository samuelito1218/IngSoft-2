// src/services/LocationService.js
import { ref, set, onValue } from 'firebase/database';
import { db } from '../firebase/config';
import api from './api';

class LocationService {
  // Update location
  updateLocation = async (pedidoId, { lat, lng, heading }) => {
    try {
      if (!pedidoId || !lat || !lng) {
        console.error('Missing required parameters for location update');
        return;
      }
      
      // 1. Send to backend API
      await api.put(`/ubicacion/pedido/${pedidoId}`, {
        latitud: lat,
        longitud: lng,
        heading: heading || 0
      });
      
      // 2. Update in Firebase for real-time
      const locationRef = ref(db, `deliveries/${pedidoId}/location`);
      await set(locationRef, {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        heading: heading ? parseFloat(heading) : 0,
        timestamp: Date.now()
      });
      
      console.log('Location updated successfully');
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  };
  
  // Subscribe to location changes
  subscribeToLocation = (pedidoId, callback) => {
    if (!pedidoId || typeof callback !== 'function') {
      console.error('Invalid parameters for location subscription');
      return () => {};
    }
    
    console.log(`Subscribing to location updates for pedido ${pedidoId}`);
    const locationRef = ref(db, `deliveries/${pedidoId}/location`);
    
    const unsubscribe = onValue(locationRef, (snapshot) => {
      if (snapshot.exists()) {
        const locationData = snapshot.val();
        console.log('Received location update:', locationData);
        callback(locationData);
      } else {
        console.log('No location data available');
        callback(null);
      }
    }, (error) => {
      console.error('Error in location subscription:', error);
    });
    
    // Return unsubscribe function to clean up
    return unsubscribe;
  };
}

export default new LocationService();