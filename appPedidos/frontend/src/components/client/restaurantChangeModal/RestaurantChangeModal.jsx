import React from 'react';
import { FaExclamationTriangle, FaStore, FaTimes } from 'react-icons/fa';
import './RestaurantChangeModal.css';

const RestaurantChangeModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  currentRestaurant, 
  newRestaurant, 
  reason 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="warning-icon">
            <FaExclamationTriangle />
          </div>
          <h2>¿Cambiar de restaurante?</h2>
          <button className="close-button" onClick={onCancel}>
            <FaTimes />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="restaurant-info">
            <div className="current-restaurant">
              <FaStore className="restaurant-icon current" />
              <div className="restaurant-details">
                <span className="label">Carrito actual:</span>
                <span className="name">{currentRestaurant}</span>
              </div>
            </div>
            
            <div className="arrow">→</div>
            
            <div className="new-restaurant">
              <FaStore className="restaurant-icon new" />
              <div className="restaurant-details">
                <span className="label">Nuevo restaurante:</span>
                <span className="name">{newRestaurant}</span>
              </div>
            </div>
          </div>
          
          <div className="warning-message">
            <p>
              <strong>⚠️ Tu carrito actual se vaciará</strong>
            </p>
            <p>
              Solo puedes ordenar productos de un restaurante a la vez. 
              Si continúas, se eliminarán todos los productos de <strong>{currentRestaurant}</strong> 
              de tu carrito.
            </p>
          </div>
        </div>
        
        <div className="modal-actions">
          <button className="cancel-button" onClick={onCancel}>
            Mantener carrito actual
          </button>
          <button className="confirm-button" onClick={onConfirm}>
            Cambiar a {newRestaurant}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantChangeModal;