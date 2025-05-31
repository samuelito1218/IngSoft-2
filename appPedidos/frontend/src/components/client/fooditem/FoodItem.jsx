import React, { useState, useContext } from 'react';
import { FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../../contexts/CartContext';
import RestaurantChangeModal from '../restaurantchangemodal/RestaurantChangeModal';
import './FoodItem.css';

const DEFAULT_IMAGE = '/images/food-placeholder.jpg';

const getImageUrl = (product) => {
  const imageFields = ['imagen', 'imageUrl', 'image', 'foto', 'picture'];
  
  for (const field of imageFields) {
    if (product[field] && product[field].trim() !== '') {
      return product[field];
    }
  }
  
  return DEFAULT_IMAGE;
};

const FoodItem = ({ product, onClick, restaurantName }) => {
  const { addToCart, removeFromCart, getItemQuantity, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  
  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [restrictionInfo, setRestrictionInfo] = useState(null);
  
  const quantity = getItemQuantity(product.id);
  
  const imageUrl = getImageUrl(product);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick(product.id);
    } else {
      navigate(`/cliente/producto/${product.id}`);
    }
  };
  
  const handleAddClick = (e) => {
    e.stopPropagation();
    setIsAdding(true);
    
    const result = addToCart(product, restaurantName);
    
    if (!result.success) {
      setRestrictionInfo({
        reason: result.reason,
        currentRestaurant: result.currentRestaurant,
        newRestaurant: restaurantName
      });
      setShowRestaurantModal(true);
      setIsAdding(false);
      return;
    }
    
    setTimeout(() => setIsAdding(false), 300);
  };
  
  const handleIncrement = (e) => {
    e.stopPropagation();
    const result = addToCart(product, restaurantName);
    
    if (!result.success) {
      setRestrictionInfo({
        reason: result.reason,
        currentRestaurant: result.currentRestaurant,
        newRestaurant: restaurantName
      });
      setShowRestaurantModal(true);
    }
  };
  
  const handleDecrement = (e) => {
    e.stopPropagation();
    removeFromCart(product.id);
  };
  
  const handleImageError = (e) => {
    if (!imageError) {
      setImageError(true);
      e.target.src = DEFAULT_IMAGE;
    }
  };
  
  const handleRestaurantChange = () => {
    clearCart();
    const result = addToCart(product, restaurantName);
    
    if (result.success) {
      setShowRestaurantModal(false);
      setRestrictionInfo(null);
    }
  };
  
  const handleRestaurantCancel = () => {
    setShowRestaurantModal(false);
    setRestrictionInfo(null);
  };
  
  return (
    <>
      <div className="food-item" onClick={handleClick}>
        <div className="food-image-container">
          <img 
            src={imageError ? DEFAULT_IMAGE : imageUrl}
            alt={product.nombre || 'Producto'}
            className="food-image"
            onError={handleImageError}
            loading="lazy"
          />
          
          {quantity === 0 ? (
            <button 
              className={`add-button ${isAdding ? 'adding' : ''}`} 
              onClick={handleAddClick}
              title="Agregar al carrito"
              aria-label="Agregar al carrito"
            >
              +
            </button>
          ) : (
            <div className="quantity-control">
              <button 
                className="quantity-button" 
                onClick={handleDecrement}
                title="Disminuir cantidad"
                aria-label="Disminuir cantidad"
              >
                −
              </button>
              <span className="quantity" aria-label={`Cantidad: ${quantity}`}>
                {quantity}
              </span>
              <button 
                className="quantity-button" 
                onClick={handleIncrement}
                title="Aumentar cantidad"
                aria-label="Aumentar cantidad"
              >
                +
              </button>
            </div>
          )}
        </div>
        
        <div className="food-info">
          <h3 className="food-name">{product.nombre || 'Producto sin nombre'}</h3>
          
          {product.descripcion && (
            <p className="food-description">{product.descripcion}</p>
          )}
          
          <div className="food-price-container">
            <span className="food-price">
              {formatPrice(product.precio || 0)}
            </span>
            
            {quantity > 0 && (
              <span className="cart-badge">
                <FaShoppingCart />
                <span className="cart-quantity">{quantity}</span>
              </span>
            )}
          </div>
        </div>
      </div>
      
      {showRestaurantModal && restrictionInfo && (
        <RestaurantChangeModal
          isOpen={showRestaurantModal}
          onConfirm={handleRestaurantChange}
          onCancel={handleRestaurantCancel}
          currentRestaurant={restrictionInfo.currentRestaurant}
          newRestaurant={restrictionInfo.newRestaurant}
          reason={restrictionInfo.reason}
        />
      )}
    </>
  );
};

export default FoodItem;