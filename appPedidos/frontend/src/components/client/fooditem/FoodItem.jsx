// src/components/client/FoodItem.jsx
import React, { useState, useContext } from 'react';
import { FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../../contexts/CartContext';
import './FoodItem.css';

const DEFAULT_IMAGE = '/images/food-placeholder.jpg';

const FoodItem = ({ product, onClick }) => {
  const { addToCart, removeFromCart, getItemQuantity } = useContext(CartContext);
  const navigate = useNavigate();
  
  const [isAdding, setIsAdding] = useState(false);
  
  // Obtener la cantidad actual en el carrito
  const quantity = getItemQuantity(product.id);
  
  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  // Manejar clic en el elemento
  const handleClick = () => {
    if (onClick) {
      onClick(product.id);
    } else {
      navigate(`/cliente/producto/${product.id}`);
    }
  };
  
  // Manejar clic en el botón de agregar
  const handleAddClick = (e) => {
    e.stopPropagation(); // Evitar que el clic se propague al elemento padre
    setIsAdding(true);
    addToCart(product);
  };
  
  // Manejar clic en el botón de incrementar cantidad
  const handleIncrement = (e) => {
    e.stopPropagation(); // Evitar que el clic se propague al elemento padre
    addToCart(product);
  };
  
  // Manejar clic en el botón de decrementar cantidad
  const handleDecrement = (e) => {
    e.stopPropagation(); // Evitar que el clic se propague al elemento padre
    removeFromCart(product.id);
  };
  
  return (
    <div className="food-item" onClick={handleClick}>
      <div className="food-image-container">
        <img 
          src={product.imagen || DEFAULT_IMAGE} 
          alt={product.nombre}
          className="food-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_IMAGE;
          }}
        />
        
        {quantity === 0 ? (
          <button className="add-button" onClick={handleAddClick}>
            <FaPlus />
          </button>
        ) : (
          <div className="quantity-control">
            <button className="quantity-button" onClick={handleDecrement}>
              <FaMinus />
            </button>
            <span className="quantity">{quantity}</span>
            <button className="quantity-button" onClick={handleIncrement}>
              <FaPlus />
            </button>
          </div>
        )}
      </div>
      
      <div className="food-info">
        <h3 className="food-name">{product.nombre}</h3>
        
        {product.descripcion && (
          <p className="food-description">{product.descripcion}</p>
        )}
        
        <div className="food-price-container">
          <span className="food-price">{formatPrice(product.precio)}</span>
          
          {quantity > 0 && (
            <span className="cart-badge">
              <FaShoppingCart />
              <span className="cart-quantity">{quantity}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodItem;