// src/services/LocationService.js
import ApiService from './api';
import { ref, onValue, set, get, onDisconnect } from 'firebase/database';
import { db } from '../firebase/config';

class LocationService {
  // Cache para evitar multiples peticiones a la misma ubicación que no existe
  #locationFetchAttempts = new Map();
  #geolocationDenied = false;
  
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
      try {
        await ApiService.ubicacion.actualizar(pedidoId, locationData.latitud, locationData.longitud, heading);
      } catch (apiError) {
        console.error('Error al actualizar ubicación en el backend:', apiError);
        // Continuar con Firebase incluso si el backend falla
      }
      
      // 2. Actualizar en Firebase para tiempo real
      try {
        const locationRef = ref(db, `deliveries/${pedidoId}/location`);
        await set(locationRef, {
          lat: parseFloat(position.lat),
          lng: parseFloat(position.lng),
          heading: heading ? parseFloat(heading) : 0,
          timestamp: Date.now(),
          isOnline: true
        });
        
        // 3. Configurar cleanup cuando el usuario se desconecta
        const onDisconnectRef = onDisconnect(locationRef);
        onDisconnectRef.update({
          isOnline: false,
          lastSeen: Date.now()
        });
      } catch (firebaseError) {
        console.error('Error al actualizar ubicación en Firebase:', firebaseError);
      }
      
      // Limpiar el registro de intentos fallidos
      this.#locationFetchAttempts.delete(pedidoId);
      
      return true;
    } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      return false;
    }
  }

  // Obtener la ubicación actual
  async getCurrentLocation(pedidoId) {
    try {
      if (!pedidoId) return null;
      
      // Verificar si ya hemos intentado obtener esta ubicación y falló
      if (this.#locationFetchAttempts.has(pedidoId)) {
        const attempts = this.#locationFetchAttempts.get(pedidoId);
        const lastAttempt = attempts.lastAttempt;
        
        // Si se ha intentado recientemente (menos de 10 segundos), no volver a intentar
        if (Date.now() - lastAttempt < 10000 && attempts.count > 2) {
          console.log(`Omitiendo consulta repetida para pedido ${pedidoId}`);
          return null;
        }
      }
      
      // Intentar obtener de Firebase primero
      try {
        const locationRef = ref(db, `deliveries/${pedidoId}/location`);
        const snapshot = await get(locationRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data && data.lat && data.lng) {
            // Limpiar el registro de intentos
            this.#locationFetchAttempts.delete(pedidoId);
            
            return {
              lat: parseFloat(data.lat),
              lng: parseFloat(data.lng),
              heading: data.heading || 0,
              timestamp: data.timestamp || Date.now(),
              isOnline: data.isOnline || false
            };
          }
        }
      } catch (firebaseError) {
        console.log("Firebase no disponible, intentando backend");
      }
      
      // Si no está en Firebase, intentar con el backend
      try {
        const response = await ApiService.ubicacion.obtener(pedidoId);
        if (response?.data) {
          // Limpiar el registro de intentos
          this.#locationFetchAttempts.delete(pedidoId);
          
          return {
            lat: parseFloat(response.data.latitud),
            lng: parseFloat(response.data.longitud),
            heading: response.data.heading || 0,
            timestamp: new Date(response.data.fechaActualizacion).getTime()
          };
        }
      } catch (apiError) {
        // Si es un 404, registrar el intento
        if (apiError.response?.status === 404) {
          const attempts = this.#locationFetchAttempts.get(pedidoId) || { count: 0 };
          this.#locationFetchAttempts.set(pedidoId, {
            count: attempts.count + 1,
            lastAttempt: Date.now()
          });
        } else {
          console.error("Error al obtener ubicación del backend:", apiError);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener ubicación actual:', error);
      return null;
    }
  }

  // Suscribirse a actualizaciones de ubicación
  subscribeToLocationUpdates(pedidoId, callback) {
    if (!pedidoId || typeof callback !== 'function') {
      console.log('Parámetros inválidos para subscribeToLocationUpdates');
      return () => {}; // Función vacía por defecto
    }
    
    try {
      const locationRef = ref(db, `deliveries/${pedidoId}/location`);
      let lastData = null;
      
      const unsubscribe = onValue(locationRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data && data.lat && data.lng) {
            const locationData = {
              lat: parseFloat(data.lat),
              lng: parseFloat(data.lng),
              heading: data.heading || 0,
              timestamp: data.timestamp || Date.now(),
              isOnline: data.isOnline || false
            };
            
            // Solo notificar si los datos han cambiado significativamente
            const hasChanged = !lastData || 
              Math.abs(lastData.lat - locationData.lat) > 0.0001 || 
              Math.abs(lastData.lng - locationData.lng) > 0.0001;
            
            if (hasChanged) {
              lastData = locationData;
              callback(locationData);
            }
          }
        } else {
          // Ubicación no disponible
          callback(null);
        }
      }, (error) => {
        console.error('Error en suscripción a ubicación:', error);
        callback(null, error.message);
      });
      
      // Intentar inicializar la ubicación de forma segura
      setTimeout(() => {
        this.getCurrentLocation(pedidoId).catch(error => {
          console.error("Error al inicializar ubicación:", error);
        });
      }, 1000);
      
      return unsubscribe;
    } catch (error) {
      console.error('Error al suscribirse a actualizaciones de ubicación:', error);
      return () => {}; // Función vacía en caso de error
    }
  }
}

export default new LocationService();