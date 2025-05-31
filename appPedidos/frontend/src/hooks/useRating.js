import { useState, useEffect } from 'react';
import { api } from '../services/api'; 

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
          setRating({
            calificacionPromedio: 0,
            totalCalificaciones: 0,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        console.error(`Error al obtener calificaciones del restaurante ${restaurantId}:`, error);
        
        setRating({
          calificacionPromedio: 0,
          totalCalificaciones: 0,
          loading: false,
          error: null 
        });
      }
    };

    fetchRating();
  }, [restaurantId]);

  return rating;
};

export const useMultipleRatings = (restaurantIds) => {
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!restaurantIds || restaurantIds.length === 0) return;

    const fetchMultipleRatings = async () => {
      setLoading(true);
      const newRatings = {};

      console.log('Obteniendo calificaciones para múltiples restaurantes:', restaurantIds);

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
  }, [JSON.stringify(restaurantIds)]); 

  return { ratings, loading };
};