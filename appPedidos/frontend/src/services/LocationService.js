// src/services/LocationService.js - Corregido
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
        console.error('Error al actualizar ubicación en el backend, continuando con Firebase:', apiError);
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
        // No relanzar el error para evitar bloquear la funcionalidad
      }
      
      // Limpiar el registro de intentos fallidos para este pedido
      this.#locationFetchAttempts.delete(pedidoId);
      
      return true;
    } catch (error) {
      console.error('Error al actualizar ubicación:', error);
      // No relanzar para evitar errores en cascada
      return false;
    }
  }
  
  // Iniciar seguimiento de ubicación (watchPosition)
  startTracking(pedidoId, callback) {
    if (this.#geolocationDenied) {
      if (typeof callback === 'function') {
        callback(null, 'El usuario denegó el permiso de geolocalización anteriormente.');
      }
      return () => {}; // Función vacía
    }
    
    if (!navigator.geolocation) {
      if (typeof callback === 'function') {
        callback(null, 'Geolocalización no soportada en este navegador');
      }
      return () => {}; // Función vacía
    }
    
    if (!pedidoId) {
      if (typeof callback === 'function') {
        callback(null, 'Se requiere ID de pedido para iniciar seguimiento');
      }
      return () => {}; // Función vacía
    }
    
    let watchId = null;
    
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
        const updated = await this.updateLocation(pedidoId, locationData, heading);
        
        // Llamar al callback con la nueva ubicación
        if (typeof callback === 'function' && updated) {
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
          this.#geolocationDenied = true; // Marcar que el usuario denegó el permiso
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
    
    try {
      // Iniciar watch position
      watchId = navigator.geolocation.watchPosition(
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
    } catch (error) {
      console.error('Error al iniciar el seguimiento:', error);
      if (typeof callback === 'function') {
        callback(null, 'Error al iniciar el seguimiento de ubicación');
      }
    }
    
    // Devolver función para detener seguimiento
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        
        // Establecer estado offline en Firebase
        try {
          const locationRef = ref(db, `deliveries/${pedidoId}/location`);
          set(locationRef, {
            isOnline: false,
            lastSeen: Date.now()
          });
        } catch (error) {
          console.error('Error al establecer estado offline:', error);
        }
      }
    };
  }
  
  // Inicializar ubicación si no existe
  async #initializeLocation(pedidoId) {
    if (!pedidoId || this.#geolocationDenied) return;
    
    try {
      // Verificar si ya existe una ubicación para no crear una nueva innecesariamente
      const location = await this.getCurrentLocation(pedidoId);
      if (location) return; // Ya existe una ubicación
      
      // Si el usuario ya ha denegado el permiso, no intentar nuevamente
      if (this.#geolocationDenied) return;
      
      // Si no hay ubicación, intentar crear una con la posición actual
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude, heading } = position.coords;
              // Solo crear si tenemos una posición válida
              if (latitude && longitude) {
                await this.updateLocation(
                  pedidoId, 
                  { lat: latitude, lng: longitude }, 
                  heading || 0
                );
              }
            } catch (error) {
              console.error('Error al crear ubicación inicial:', error);
            }
          },
          (error) => {
            console.error('Error al obtener posición inicial:', error);
            if (error.code === error.PERMISSION_DENIED) {
              this.#geolocationDenied = true;
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    } catch (error) {
      console.error('Error al inicializar ubicación:', error);
    }
  }
  
  // Obtener la ubicación actual desde Firebase o backend
  async getCurrentLocation(pedidoId) {
    try {
      if (!pedidoId) {
        return null;
      }
      
      // Primero verificar el estado del pedido
    try {
      const pedidoResponse = await ApiService.pedidos.detalle(pedidoId);
      if (pedidoResponse && pedidoResponse.data && pedidoResponse.data.pedido) {
        const pedido = pedidoResponse.data.pedido;
        
        // Si el pedido ya está entregado, retornar un objeto especial
        if (pedido.estado === 'Entregado') {
          return {
            isDelivered: true,
            message: 'Ubicación finalizada. El pedido ha sido entregado.',
            lat: pedido.direccionEntrega.lat || 3.45, // Usar coordenadas de entrega o valores por defecto
            lng: pedido.direccionEntrega.lng || -76.53
          };
        }
      }
    } catch (pedidoError) {
      console.log("No se pudo verificar el estado del pedido:", pedidoError);
      // Continuar con el flujo normal si no podemos verificar el estado
    }
    
    // Verificar si ya hemos intentado obtener esta ubicación y falló
    if (this.#locationFetchAttempts.has(pedidoId)) {
      const attempts = this.#locationFetchAttempts.get(pedidoId);
      const lastAttempt = attempts.lastAttempt;
      
      // Si se ha intentado recientemente (menos de 30 segundos), no volver a intentar
      if (Date.now() - lastAttempt < 30000 && attempts.count > 2) {
        console.log(`Omitiendo consulta repetida para pedido ${pedidoId} (intentos: ${attempts.count})`);
        return null;
      }
    }
      
      // Intentar obtener de Firebase primero (tiempo real)
      try {
        const locationRef = ref(db, `deliveries/${pedidoId}/location`);
        const snapshot = await get(locationRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Verificar que tenemos datos válidos
          if (data && data.lat && data.lng) {
            // Restablecer contador de intentos
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
        console.log("Firebase no disponible, intentando backend:", firebaseError);
      }
      
      // Si no está en Firebase, intentar con el backend
      try {
        const response = await ApiService.ubicacion.obtener(pedidoId);
        
        if (response && response.data) {
          // Restablecer contador de intentos
          this.#locationFetchAttempts.delete(pedidoId);
          
          return {
            lat: parseFloat(response.data.latitud),
            lng: parseFloat(response.data.longitud),
            heading: response.data.heading || 0,
            timestamp: new Date(response.data.fechaActualizacion).getTime()
          };
        }
      } catch (apiError) {
        // Si es un 404, significa que la ubicación no existe aún
        if (apiError.response && apiError.response.status === 404) {
          // Registrar el intento fallido
          const attempts = this.#locationFetchAttempts.get(pedidoId) || { count: 0 };
          this.#locationFetchAttempts.set(pedidoId, {
            count: attempts.count + 1,
            lastAttempt: Date.now()
          });
          
          console.log(`Ubicación para pedido ${pedidoId} aún no creada en el backend (intento ${attempts.count + 1})`);
        } else {
          console.error("Error al obtener ubicación del backend:", apiError);
        }
      }
      
      // Si llegamos aquí, no hay ubicación disponible
      return null;
    } catch (error) {
      console.error('Error al obtener ubicación actual:', error);
      return null;
    }
  }
  
  // Suscribirse a actualizaciones de ubicación en tiempo real
  subscribeToLocationUpdates(pedidoId, callback) {
    if (!pedidoId || typeof callback !== 'function') {
      console.log('Parámetros inválidos para subscribeToLocationUpdates');
      return () => {}; // Función vacía por defecto
    }
    
    try {
      // Referencia a la ubicación en Firebase
      const locationRef = ref(db, `deliveries/${pedidoId}/location`);
      
      // Variable para evitar callbacks duplicados
      let lastData = null;
      
      // Escuchar cambios en tiempo real
      const unsubscribe = onValue(locationRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          
          // Verificar si los datos son válidos
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
      
      // Intentar inicializar la ubicación de forma segura, sin generar errores en cascada
      setTimeout(() => {
        this.#initializeLocation(pedidoId).catch(error => {
          console.error("Error al inicializar ubicación:", error);
        });
      }, 1000);
      
      // Devolver función para cancelar suscripción
      return unsubscribe;
    } catch (error) {
      console.error('Error al suscribirse a actualizaciones de ubicación:', error);
      return () => {}; // Función vacía en caso de error
    }
  }
  
  // Calcular distancia entre dos coordenadas (fórmula de Haversine)
  calculateDistance(lat1, lon1, lat2, lon2) {
    try {
      if (!lat1 || !lon1 || !lat2 || !lon2) return null;
      
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
    } catch (error) {
      console.error('Error al calcular distancia:', error);
      return null;
    }
  }
  
  // Conversión de grados a radianes
  toRad(degrees) {
    return degrees * Math.PI / 180;
  }
  
  // Calcular tiempo estimado de llegada
  calculateETA(distance, speedKmh = 30) {
    if (!distance) return null;
    
    try {
      // Tiempo en minutos = distancia (km) / velocidad (km/h) * 60
      const timeMinutes = Math.round((distance / speedKmh) * 60);
      
      if (timeMinutes < 1) {
        return 'Menos de 1 minuto';
      } else if (timeMinutes === 1) {
        return '1 minuto';
      } else {
        return `${timeMinutes} minutos`;
      }
    } catch (error) {
      console.error('Error al calcular ETA:', error);
      return null;
    }
  }
}

export default new LocationService();