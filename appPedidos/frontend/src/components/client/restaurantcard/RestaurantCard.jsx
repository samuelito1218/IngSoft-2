import React from 'react';
import { FaStar, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import './RestaurantCard.css';

const DEFAULT_IMAGE = '/images/restaurant-placeholder.jpg';

const RestaurantCard = ({ restaurant, onClick }) => {
  // Adaptador para manejar diferentes formatos de datos
  const restaurantData = {
    nombre: restaurant.nombre || 'Restaurante sin nombre',
    descripcion: restaurant.descripcion || '',
    // Usa imageUrl si existe, sino imagen, o valor por defecto
    imagen: restaurant.imageUrl || restaurant.imagen || DEFAULT_IMAGE,
    // Valores por defecto para campos que pueden no existir
    calificaciones: restaurant.calificaciones || [],
    tiempoEntrega: restaurant.tiempoEntrega || '30-45 min',
    categorias: restaurant.categorias || ['General'],
    ubicaciones: restaurant.ubicaciones || [],
    envioGratis: restaurant.envioGratis || false
  };
  
  // Calcular la calificación promedio
  const getAverageRating = () => {
    if (restaurantData.calificaciones.length === 0) {
      return 4.5; // Valor por defecto para mejor UI
    }
    
    const total = restaurantData.calificaciones.reduce((sum, rating) => sum + rating.valor, 0);
    return (total / restaurantData.calificaciones.length).toFixed(1);
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
            <span>{getAverageRating()}</span>
            <span className="rating-count">({restaurantData.calificaciones.length})</span>
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