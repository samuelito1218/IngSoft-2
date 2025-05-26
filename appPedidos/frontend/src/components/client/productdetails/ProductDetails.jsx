// src/components/client/ProductDetails.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaMinus, FaStore, FaShoppingCart } from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import { CartContext } from '../../../contexts/CartContext';
import ApiService from '../../../services/api';
import RestaurantChangeModal from '../restaurantChangeModal/RestaurantChangeModal';

import './ProductDetails.css';


const DEFAULT_IMAGE = '/images/food-placeholder.jpg';

// Función helper para obtener la URL de imagen correcta (igual que en FoodItem)
const getImageUrl = (product) => {
  const imageFields = ['imagen', 'imageUrl', 'image', 'foto', 'picture'];
  
  for (const field of imageFields) {
    if (product[field] && product[field].trim() !== '') {
      return product[field];
    }
  }
  
  return DEFAULT_IMAGE;
};

const ProductDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { addToCart, removeFromCart, getItemQuantity } = useContext(CartContext);
  
  const [product, setProduct] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [relatedImageErrors, setRelatedImageErrors] = useState({}); // Para productos relacionados


  // Agregar estados para el modal (después de los estados existentes):
const [showRestaurantModal, setShowRestaurantModal] = useState(false);
const [restrictionInfo, setRestrictionInfo] = useState(null);

  
  // Cargar información del producto
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener información del producto
        const response = await ApiService.productos.detalle(id);
        
        if (!response.data) {
          throw new Error('No se encontró información del producto');
        }
        
        const productData = response.data;
        setProduct(productData);
        
        // Resetear error de imagen cuando cambia el producto
        setImageError(false);
        
        // Obtener información del restaurante
        if (productData.restaurante_Id) {
          const restaurantResponse = await ApiService.restaurantes.detalle(productData.restaurante_Id);
          if (restaurantResponse.data) {
            setRestaurant(restaurantResponse.data);
          }
          
          // Obtener productos relacionados
          const relatedResponse = await ApiService.productos.porRestaurante(productData.restaurante_Id);
          if (relatedResponse.data && Array.isArray(relatedResponse.data)) {
            // Filtrar el producto actual
            const filtered = relatedResponse.data.filter(item => item.id !== id);
            setRelatedProducts(filtered.slice(0, 4));
            // Resetear errores de imágenes relacionadas
            setRelatedImageErrors({});
          }
        }
        
        // Obtener cantidad en carrito
        const cartQuantity = getItemQuantity(id);
        setQuantity(cartQuantity);
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar información del producto:', error);
        setError('No se pudo cargar la información del producto. Intente nuevamente.');
        setLoading(false);
      }
    };
    
    fetchProductData();
  }, [id, getItemQuantity]);
  
  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  // Manejar error de imagen principal
  const handleImageError = (e) => {
    if (!imageError) {
      setImageError(true);
      e.target.src = DEFAULT_IMAGE;
    }
  };
  
  // Manejar error de imagen de productos relacionados
  const handleRelatedImageError = (productId) => {
    setRelatedImageErrors(prev => ({
      ...prev,
      [productId]: true
    }));
  };
  
  // Manejar incremento de cantidad
  const handleIncrement = () => {
  if (product) {
    const result = addToCart(product, restaurant?.nombre);
    
    if (!result.success) {
      setRestrictionInfo({
        reason: result.reason,
        currentRestaurant: result.currentRestaurant,
        newRestaurant: restaurant?.nombre
      });
      setShowRestaurantModal(true);
      return;
    }
    
    setQuantity(prev => prev + 1);
  }
};


const handleRestaurantChange = () => {
  clearCart();
  const result = addToCart(product, restaurant?.nombre);
  
  if (result.success) {
    setQuantity(1);
    setShowRestaurantModal(false);
    setRestrictionInfo(null);
  }
};

const handleRestaurantCancel = () => {
  setShowRestaurantModal(false);
  setRestrictionInfo(null);
};
  // Manejar decremento de cantidad
  const handleDecrement = () => {
    if (quantity > 0) {
      removeFromCart(id);
      setQuantity(prev => prev - 1);
    }
  };
  
  // Ir al carrito
  const goToCart = () => {
    navigate('/cliente/carrito');
  };
  
  // Ir al restaurante
  const goToRestaurant = () => {
    if (restaurant) {
      navigate(`/cliente/restaurante/${restaurant.id}`);
    }
  };
  
  // Volver atrás
  const handleBack = () => {
    navigate(-1);
  };
  
  // Ver producto relacionado
  const viewRelatedProduct = (productId) => {
    navigate(`/cliente/producto/${productId}`);
  };
  
  if (loading) {
    return (
      <div className="product-details-loading">
        <div className="spinner"></div>
        <p>Cargando información del producto...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="product-details-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
        <button onClick={handleBack} className="secondary">Volver atrás</button>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="product-details-error">
        <p>No se encontró el producto solicitado.</p>
        <button onClick={handleBack}>Volver atrás</button>
      </div>
    );
  }
  
  // Obtener URL de imagen del producto principal
  const productImageUrl = getImageUrl(product);
  
  return (
    <div className="product-details">
      <div className="product-header">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft />
        </button>
        
        <button className="cart-button" onClick={goToCart}>
          <FaShoppingCart />
          {quantity > 0 && (
            <span className="cart-count">{quantity}</span>
          )}
        </button>
      </div>
      
      <div className="product-content">
        <div className="product-image-container">
          <img 
            src={imageError ? DEFAULT_IMAGE : productImageUrl}
            alt={product.nombre || 'Producto'}
            className="product-image"
            onError={handleImageError}
            loading="lazy"
          />
        </div>
        
        <div className="product-info">
          <h1 className="product-name">{product.nombre}</h1>
          
          {restaurant && (
            <div className="restaurant-link" onClick={goToRestaurant}>
              <FaStore />
              <span>{restaurant.nombre}</span>
            </div>
          )}
          
          <p className="product-price">{formatPrice(product.precio)}</p>
          
          {product.descripcion && (
            <p className="product-description">{product.descripcion}</p>
          )}
          
          <div className="product-actions">
            <div className="quantity-control">
              <button 
                className="quantity-button" 
                onClick={handleDecrement}
                disabled={quantity === 0}
                title="Disminuir cantidad"
                aria-label="Disminuir cantidad"
              >
                <FaMinus />
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
                <FaPlus />
              </button>
            </div>
            
            <button 
              className="add-to-cart-button"
              onClick={quantity === 0 ? handleIncrement : goToCart}
            >
              {quantity === 0 ? 'Agregar al carrito' : 'Ver carrito'}
              <FaShoppingCart />
            </button>
          </div>
        </div>
      </div>
      
      {relatedProducts.length > 0 && (
        <div className="related-products">
          <h2>Productos relacionados</h2>
          
          <div className="related-products-grid">
            {relatedProducts.map(relatedProduct => {
              const relatedImageUrl = getImageUrl(relatedProduct);
              const hasRelatedImageError = relatedImageErrors[relatedProduct.id];
              
              return (
                <div 
                  key={relatedProduct.id} 
                  className="related-product"
                  onClick={() => viewRelatedProduct(relatedProduct.id)}
                >
                  <div className="related-product-image">
                    <img 
                      src={hasRelatedImageError ? DEFAULT_IMAGE : relatedImageUrl}
                      alt={relatedProduct.nombre || 'Producto relacionado'}
                      onError={() => handleRelatedImageError(relatedProduct.id)}
                      loading="lazy"
                    />
                  </div>
                  <div className="related-product-info">
                    <h3>{relatedProduct.nombre}</h3>
                    <p>{formatPrice(relatedProduct.precio)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de cambio de restaurante */}
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
    </div>
  );
};

export default ProductDetails;