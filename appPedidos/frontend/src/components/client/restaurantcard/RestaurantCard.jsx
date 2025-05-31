import React from 'react';
import { FaStar, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { useRating } from '../../../hooks/useRating';
import './RestaurantCard.css';

const DEFAULT_IMAGE = '/images/restaurant-placeholder.jpg';

const RestaurantCard = ({ restaurant, onClick }) => {
  const { calificacionPromedio, totalCalificaciones, loading } = useRating(restaurant.id);
  
  const restaurantData = {
    nombre: restaurant.nombre || 'Restaurante sin nombre',
    descripcion: restaurant.descripcion || '',
    imagen: restaurant.imageUrl || restaurant.imagen || DEFAULT_IMAGE,
    tiempoEntrega: restaurant.tiempoEntrega || '30-45 min',
    categorias: restaurant.categorias || ['General'],
    ubicaciones: restaurant.ubicaciones || [],
    envioGratis: restaurant.envioGratis || false
  };
  
  const formatRating = (rating) => {
    if (rating === 0) return '0.0';
    return Number(rating).toFixed(1);
  };
  
  return (
    <div className="restaurant-card" onClick={onClick}>
      <div className="restaurant-image">
        <img 
          src={restaurantData.imagen} 
          alt={restaurantData.nombre}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_IMAGE;
          }}
        />
        {restaurantData.envioGratis && <span className="free-delivery-badge">Envío gratis</span>}
      </div>
      
      <div className="restaurant-info">
        <h3 className="restaurant-name">{restaurantData.nombre}</h3>
        
        <div className="rating-time">
          <div className="rating">
            <FaStar className="star-icon" />
            {loading ? (
              <span className="rating-loading">...</span>
            ) : (
              <>
                <span>{formatRating(calificacionPromedio)}</span>
                <span className="rating-count">({totalCalificaciones})</span>
              </>
            )}
          </div>
          
          <div className="delivery-time">
            <FaClock className="clock-icon" />
            <span>{restaurantData.tiempoEntrega}</span>
          </div>
        </div>
        
        <div className="restaurant-details">
          <p className="restaurant-categories">
            {Array.isArray(restaurantData.categorias) 
              ? restaurantData.categorias.slice(0, 2).join(' • ') 
              : 'General'}
          </p>
          
          {restaurantData.ubicaciones.length > 0 && (
            <div className="location">
              <FaMapMarkerAlt className="location-icon" />
              <span>{restaurantData.ubicaciones[0].comuna || 'Cali'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;