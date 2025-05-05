// src/components/client/RestaurantCard.jsx
import React from 'react';
import { FaStar, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import './RestaurantCard.css';

const DEFAULT_IMAGE = '/images/restaurant-placeholder.jpg';

const RestaurantCard = ({ restaurant, onClick }) => {
  // Calcular la calificación promedio
  const getAverageRating = () => {
    if (!restaurant.calificaciones || restaurant.calificaciones.length === 0) {
      return 0;
    }
    
    const total = restaurant.calificaciones.reduce((sum, rating) => sum + rating.valor, 0);
    return (total / restaurant.calificaciones.length).toFixed(1);
  };
  
  // Formatear tiempo de entrega estimado
  const formatDeliveryTime = () => {
    return restaurant.tiempoEntrega || '30-45 min';
  };
  
  // Formatear categorías
  const formatCategories = () => {
    if (!restaurant.categorias || restaurant.categorias.length === 0) {
      return 'General';
    }
    
    return restaurant.categorias.slice(0, 2).join(' • ');
  };
  
  return (
    <div className="restaurant-card" onClick={onClick}>
      <div className="restaurant-image">
        <img 
          src={restaurant.imagen || DEFAULT_IMAGE} 
          alt={restaurant.nombre}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_IMAGE;
          }}
        />
        {restaurant.envioGratis && <span className="free-delivery-badge">Envío gratis</span>}
      </div>
      
      <div className="restaurant-info">
        <h3 className="restaurant-name">{restaurant.nombre}</h3>
        
        <div className="rating-time">
          <div className="rating">
            <FaStar className="star-icon" />
            <span>{getAverageRating()}</span>
            <span className="rating-count">({restaurant.calificaciones?.length || 0})</span>
          </div>
          
          <div className="delivery-time">
            <FaClock className="clock-icon" />
            <span>{formatDeliveryTime()}</span>
          </div>
        </div>
        
        <div className="restaurant-details">
          <p className="restaurant-categories">{formatCategories()}</p>
          
          {restaurant.ubicaciones && restaurant.ubicaciones.length > 0 && (
            <div className="location">
              <FaMapMarkerAlt className="location-icon" />
              <span>{restaurant.ubicaciones[0].comuna || 'Cali'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;