import React from 'react';
import { FaRegStar, FaMapMarkerAlt, FaEdit, FaTrashAlt, FaUtensils } from 'react-icons/fa';
import './RestaurantCard.css';

const DEFAULT_IMAGE = '/images/restaurant-placeholder.jpg';

const RestaurantCard = ({ restaurant, onClick, onEdit, onDelete, onManageProducts }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(restaurant.id);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(restaurant.id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(restaurant);
    }
  };

  const handleManageProducts = (e) => {
    e.stopPropagation();
    if (onManageProducts) {
      onManageProducts(restaurant.id);
    }
  };

  return (
    <div className="restaurant-card" onClick={handleClick}>
      <div className="restaurant-image">
        <img 
          src={restaurant.imageUrl || DEFAULT_IMAGE} 
          alt={restaurant.nombre}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_IMAGE;
          }}
        />
      </div>
      
      <div className="restaurant-info">
        <h3 className="restaurant-name">{restaurant.nombre}</h3>
        
        {restaurant.descripcion && (
          <p className="restaurant-description">{restaurant.descripcion}</p>
        )}
        
        <div className="restaurant-meta">
          <div className="meta-item">
            <FaRegStar className="meta-icon" />
            <span>5.0</span>
          </div>
          
          {restaurant.categorias && restaurant.categorias.length > 0 && (
            <div className="meta-item">
              <span className="category-tag">{restaurant.categorias[0]}</span>
              {restaurant.categorias.length > 1 && (
                <span className="categories-more">+{restaurant.categorias.length - 1}</span>
              )}
            </div>
          )}
          
          {restaurant.ubicaciones && restaurant.ubicaciones.length > 0 && (
            <div className="meta-item">
              <FaMapMarkerAlt className="meta-icon" />
              <span>{restaurant.ubicaciones[0].comuna || 'No especificada'}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="restaurant-actions">
        <button className="action-button products" onClick={handleManageProducts || handleClick} title="Gestionar productos">
          <FaUtensils />
          <span>Productos</span>
        </button>
        
        <button className="action-button edit" onClick={handleEdit || handleClick} title="Editar restaurante">
          <FaEdit />
          <span>Editar</span>
        </button>
        
        <button className="action-button delete" onClick={handleDelete} title="Eliminar restaurante">
          <FaTrashAlt />
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  );
};

export default RestaurantCard;