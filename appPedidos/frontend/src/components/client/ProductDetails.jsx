import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/ProductDetails.css';

function ProductDetails() {
  const { id } = useParams(); // ID del producto
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  
  // Cálculos derivados
  const [productPrice, setProductPrice] = useState(0);
  const [optionsPrice, setOptionsPrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // Aquí harías la llamada a la API para obtener el producto
        // const response = await api.get(`/productos/${id}`);
        
        // Datos de muestra para hacer pruebas
        const mockProduct = {
          id: id,
          nombre: 'Hamburguesa Especial',
          especificaciones: 'Deliciosa hamburguesa con carne 100% de res, queso, lechuga, tomate, cebolla y nuestra salsa especial.',
          precio: 15000,
          restaurante_Id: '123',
          restauranteName: 'Burger House',
          imageUrl: 'https://via.placeholder.com/500x300?text=Hamburguesa+Especial',
          options: [
            { id: '1', name: 'Queso extra', price: 2000 },
            { id: '2', name: 'Tocineta', price: 3000 },
            { id: '3', name: 'Huevo frito', price: 2500 },
            { id: '4', name: 'Guacamole', price: 2800 }
          ]
        };
        
        setProduct(mockProduct);
        setProductPrice(mockProduct.precio);
        setTotalPrice(mockProduct.precio);
        
      } catch (err) {
        console.error('Error al cargar producto:', err);
        setError('No se pudo cargar el producto. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  useEffect(() => {
    // Actualizar precios cuando cambian las opciones o la cantidad
    if (product) {
      const totalOptions = selectedOptions.reduce((sum, optionId) => {
        const option = product.options.find(opt => opt.id === optionId);
        return sum + (option ? option.price : 0);
      }, 0);
      
      setOptionsPrice(totalOptions);
      setTotalPrice((product.precio + totalOptions) * quantity);
    }
  }, [product, selectedOptions, quantity]);
  
  const handleOptionChange = (optionId) => {
    if (selectedOptions.includes(optionId)) {
      setSelectedOptions(selectedOptions.filter(id => id !== optionId));
    } else {
      setSelectedOptions([...selectedOptions, optionId]);
    }
  };
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };
  
  const addToCart = () => {
    if (!product) return;
    
    // Obtener carrito actual del localStorage
    const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Preparar el producto con las opciones seleccionadas
    const selectedOptionDetails = selectedOptions.map(optionId => {
      const option = product.options.find(opt => opt.id === optionId);
      return option ? option.name : '';
    }).join(', ');
    
    // Crear objeto del producto para el carrito
    const cartItem = {
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      quantity: quantity,
      restaurante_Id: product.restaurante_Id,
      restauranteName: product.restauranteName,
      imageUrl: product.imageUrl,
      especificaciones: product.especificaciones + (selectedOptionDetails ? ` (${selectedOptionDetails})` : ''),
      specialInstructions: specialInstructions,
      selectedOptions: selectedOptions
    };
    
    // Agregar al carrito
    currentCart.push(cartItem);
    localStorage.setItem('cart', JSON.stringify(currentCart));
    
    // Mostrar confirmación
    setAddedToCart(true);
    setTimeout(() => {
      setAddedToCart(false);
    }, 2000);
  };
  
  if (loading) {
    return <div className="loading-container">Cargando producto...</div>;
  }
  
  if (error) {
    return <div className="error-container">{error}</div>;
  }
  
  if (!product) {
    return <div className="error-container">No se encontró el producto.</div>;
  }
  
  return (
    <div className="product-details">
      <div className="back-button" onClick={() => navigate(-1)}>
        ← Volver
      </div>
      
      <div className="product-card">
        <img 
          src={product.imageUrl || "https://via.placeholder.com/500x300?text=Imagen+no+disponible"} 
          alt={product.nombre} 
          className="product-image" 
        />
        
        <div className="product-info">
          <div className="product-header">
            <h1 className="product-name">{product.nombre}</h1>
            <div className="product-restaurant">
              De{' '}
              <Link to={`/cliente/restaurante/${product.restaurante_Id}`} className="restaurant-link">
                {product.restauranteName}
              </Link>
            </div>
          </div>
          
          <p className="product-description">{product.especificaciones}</p>
          
          <div className="product-price">${product.precio.toLocaleString()}</div>
          
          {product.options && product.options.length > 0 && (
            <div className="options-section">
              <h2 className="section-title">Adicionales</h2>
              <div className="options-list">
                {product.options.map(option => (
                  <div className="option-item" key={option.id}>
                    <input 
                      type="checkbox" 
                      id={`option-${option.id}`} 
                      className="option-checkbox" 
                      checked={selectedOptions.includes(option.id)} 
                      onChange={() => handleOptionChange(option.id)} 
                    />
                    <label htmlFor={`option-${option.id}`} className="option-label">{option.name}</label>
                    <span className="option-price">+${option.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="quantity-control">
            <button 
              className="quantity-button" 
              onClick={decreaseQuantity} 
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="quantity-value">{quantity}</span>
            <button 
              className="quantity-button" 
              onClick={increaseQuantity}
            >
              +
            </button>
          </div>
          
          <div className="special-instructions">
            <h2 className="section-title">Instrucciones especiales</h2>
            <textarea 
              className="instructions-input" 
              placeholder="Ej: Sin cebolla, sin pepinillos..." 
              value={specialInstructions} 
              onChange={(e) => setSpecialInstructions(e.target.value)} 
            ></textarea>
          </div>
          
          <div className="order-summary">
            <div className="summary-row">
              <span>Producto</span>
              <span>${productPrice.toLocaleString()}</span>
            </div>
            {optionsPrice > 0 && (
              <div className="summary-row">
                <span>Adicionales</span>
                <span>+${optionsPrice.toLocaleString()}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span>${totalPrice.toLocaleString()}</span>
            </div>
          </div>
          
          <button 
            className={`add-to-cart-button ${addedToCart ? 'added-animation' : ''}`} 
            onClick={addToCart}
          >
            {addedToCart ? '✓ Agregado al carrito' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  );
}
export default ProductDetails;