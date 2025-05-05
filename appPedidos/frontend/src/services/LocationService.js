// src/services/LocationService.js - Implementación mejorada
import ApiService from './api';
import { ref, onValue, set, get, onDisconnect } from 'firebase/database';
import { db } from '../firebase/config';

class LocationService {
  // Actualizar la ubicación en tiempo real
  async updateLocation(pedidoId, position, heading = 0) {
    try {
      if (!pedidoId || !position || !position.lat || !position.lng) {
        throw new Error('Parámetros inválidos para updateLocation');
      }
      
      const locationData = {
        latitud: position.lat,
        longitud: position.lng,
        heading: heading || 0
      };

      // 1. Actualizar en el backend
      await ApiService.ubicacion.actualizar(pedidoId, locationData.latitud, locationData.longitud);
      
      // 2. Actualizar en Firebase para tiempo real
      const locationRef = ref(db, `deliveries/${pedidoId}/location`);
      await set(locationRef, {
        lat: parseFloat(position.lat),
        lng: parseFloat(position.lng),
        heading: heading ? parseFloat(heading) : 0,
        timestamp: Date.now()
      });
      
      // 3. Configurar cleanup cuando el usuario se desconecta
      const onDisconnectRef = onDisconnect(locationRef);
      onDisconnectRef.update({
        isOnline: false,
        lastSeen: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      throw error;
    }
  }
  
  // Iniciar seguimiento de ubicación (watchPosition)
  startTracking(pedidoId, callback) {
    if (!navigator.geolocation) {
      throw new Error('Geolocalización no soportada en este navegador');
    }
    
    if (!pedidoId) {
      throw new Error('Se requiere ID de pedido para iniciar seguimiento');
    }
    
    // Opciones de geolocalización
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
    
    // Manejar actualización de posición
    const handlePositionUpdate = async (position) => {
      const { latitude, longitude, heading } = position.coords;
      
      const locationData = {
        lat: latitude,
        lng: longitude,
        heading: heading || 0,
        timestamp: Date.now()
      };
      
      try {
        // Actualizar ubicación en backend y Firebase
        await this.updateLocation(pedidoId, locationData);
        
        // Llamar al callback con la nueva ubicación
        if (typeof callback === 'function') {
          callback(locationData);
        }
      } catch (error) {
        console.error('Error al actualizar ubicación durante seguimiento:', error);
      }
    };
    
    // Manejar errores de geolocalización
    const handlePositionError = (error) => {
      console.error('Error de geolocalización:', error);
      
      let errorMessage;
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'El usuario denegó la solicitud de geolocalización.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'La información de ubicación no está disponible.';
          break;
        case error.TIMEOUT:
          errorMessage = 'La solicitud de ubicación expiró.';
          break;
        default:
          errorMessage = 'Ocurrió un error desconocido al obtener la ubicación.';
      }
      
      // Notificar error en callback
      if (typeof callback === 'function') {
        callback(null, errorMessage);
      }
    };
    
    // Iniciar watch position
    const watchId = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      handlePositionError,
      options
    );
    
    // Hacer solicitud inicial
    navigator.geolocation.getCurrentPosition(
      handlePositionUpdate,
      handlePositionError,
      options
    );
    
    // Devolver función para detener seguimiento
    return () => {
      navigator.geolocation.clearWatch(watchId);
      
      // Establecer estado offline en Firebase
      const locationRef = ref(db, `deliveries/${pedidoId}/location`);
      set(locationRef, {
        isOnline: false,
        lastSeen: Date.now()
      });
    };
  }
  
  // Obtener la ubicación actual desde Firebase o backend
  async getCurrentLocation(pedidoId) {
    try {
      if (!pedidoId) {
        throw new Error('Se requiere ID de pedido para obtener ubicación');
      }
      
      // Intentar obtener de Firebase primero (tiempo real)
      const locationRef = ref(db, `deliveries/${pedidoId}/location`);
      const snapshot = await get(locationRef);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        return {
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng),
          heading: data.heading || 0,
          timestamp: data.timestamp || Date.now()
        };
      }
      
      // Si no está en Firebase, intentar con el backend
      const response = await ApiService.ubicacion.obtener(pedidoId);
      
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
      console.error('Error al obtener ubicación actual:', error);
      return null;
    }
  }
  
  // Suscribirse a actualizaciones de ubicación en tiempo real
  subscribeToLocationUpdates(pedidoId, callback) {
    if (!pedidoId || typeof callback !== 'function') {
      console.error('Parámetros inválidos para subscribeToLocationUpdates');
      return () => {}; // Función vacía por defecto
    }
    
    try {
      // Referencia a la ubicación en Firebase
      const locationRef = ref(db, `deliveries/${pedidoId}/location`);
      
      // Escuchar cambios en tiempo real
      const unsubscribe = onValue(locationRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Verificar si los datos son válidos
          if (data && data.lat && data.lng) {
            callback({
              lat: parseFloat(data.lat),
              lng: parseFloat(data.lng),
              heading: data.heading || 0,
              timestamp: data.timestamp || Date.now()
            });
          }
        } else {
          // Ubicación no disponible
          callback(null);
        }
      }, (error) => {
        console.error('Error en suscripción a ubicación:', error);
        callback(null, error.message);
      });
      
      // Devolver función para cancelar suscripción
      return unsubscribe;
    } catch (error) {
      console.error('Error al suscribirse a actualizaciones de ubicación:', error);
      return () => {}; // Función vacía en caso de error
    }
  }
  
  // Calcular distancia entre dos coordenadas (fórmula de Haversine)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distancia en km
    return d;
  }
  
  // Conversión de grados a radianes
  toRad(degrees) {
    return degrees * Math.PI / 180;
  }
  
  // Calcular tiempo estimado de llegada
  calculateETA(distance, speedKmh = 30) {
    if (!distance) return null;
    
    // Tiempo en minutos = distancia (km) / velocidad (km/h) * 60
    const timeMinutes = Math.round((distance / speedKmh) * 60);
    
    if (timeMinutes < 1) {
      return 'Menos de 1 minuto';
    } else if (timeMinutes === 1) {
      return '1 minuto';
    } else {
      return `${timeMinutes} minutos`;
    }
  }
}

export default new LocationService();