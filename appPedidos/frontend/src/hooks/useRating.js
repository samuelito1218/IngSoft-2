// src/hooks/useRating.js
import { useState, useEffect } from 'react';
import { api } from '../services/api'; // Usar la misma importación que AdminDashboard

export const useRating = (restaurantId) => {
  const [rating, setRating] = useState({
    calificacionPromedio: 0,
    totalCalificaciones: 0,
    loading: false,
    error: null
  });

  useEffect(() => {
    if (!restaurantId) return;

    const fetchRating = async () => {
      try {
        setRating(prev => ({ ...prev, loading: true, error: null }));
        
        console.log(`Obteniendo calificaciones para restaurante: ${restaurantId}`);
        
        // Usar exactamente la misma llamada que en AdminDashboard
        const response = await api.get(`/calificaciones/restaurante/${restaurantId}`);
        
        console.log(`Respuesta de calificaciones para ${restaurantId}:`, response.data);
        
        if (response.data && response.data.restaurante) {
          const { calificacionPromedio, totalCalificaciones } = response.data.restaurante;
          
          console.log(`Calificación procesada - Promedio: ${calificacionPromedio}, Total: ${totalCalificaciones}`);
          
          setRating({
            calificacionPromedio: calificacionPromedio || 0,
            totalCalificaciones: totalCalificaciones || 0,
            loading: false,
            error: null
          });
        } else {
          console.log(`No se encontraron datos de calificación para restaurante ${restaurantId}`);
          // Si no hay datos, establecer valores por defecto
          setRating({
            calificacionPromedio: 0,
            totalCalificaciones: 0,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error(`Error al obtener calificaciones del restaurante ${restaurantId}:`, error);
        
        // En caso de error, usar valores por defecto en lugar de mostrar error
        setRating({
          calificacionPromedio: 0,
          totalCalificaciones: 0,
          loading: false,
          error: null // No mostrar error al usuario, usar valores por defecto
        });
      }
    };

    fetchRating();
  }, [restaurantId]);

  return rating;
};

// Hook para múltiples restaurantes (optimizado para listas)
export const useMultipleRatings = (restaurantIds) => {
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restaurantIds || restaurantIds.length === 0) return;

    const fetchMultipleRatings = async () => {
      setLoading(true);
      const newRatings = {};

      console.log('Obteniendo calificaciones para múltiples restaurantes:', restaurantIds);

      // Hacer las peticiones en paralelo para mejor rendimiento
      const promises = restaurantIds.map(async (id) => {
        try {
          console.log(`Llamando API para restaurante: ${id}`);
          const response = await api.get(`/calificaciones/restaurante/${id}`);
          
          console.log(`Respuesta para restaurante ${id}:`, response.data);
          
          if (response.data && response.data.restaurante) {
            newRatings[id] = {
              calificacionPromedio: response.data.restaurante.calificacionPromedio || 0,
              totalCalificaciones: response.data.restaurante.totalCalificaciones || 0
            };
          } else {
            newRatings[id] = {
              calificacionPromedio: 0,
              totalCalificaciones: 0
            };
          }
        } catch (error) {
          console.error(`Error al obtener calificaciones del restaurante ${id}:`, error);
          newRatings[id] = {
            calificacionPromedio: 0,
            totalCalificaciones: 0
          };
        }
      });

      await Promise.all(promises);
      
      console.log('Calificaciones obtenidas para todos los restaurantes:', newRatings);
      
      setRatings(newRatings);
      setLoading(false);
    };

    fetchMultipleRatings();
  }, [JSON.stringify(restaurantIds)]); // Usar JSON.stringify para comparar arrays correctamente

  return { ratings, loading };
};