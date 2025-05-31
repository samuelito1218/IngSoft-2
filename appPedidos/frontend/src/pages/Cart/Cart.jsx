import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrash, FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';
import { CartContext } from '../../contexts/CartContext';
import OrderActiveAlert from '../../components/client/orderactivealert/OrderActiveAlert';
import ApiService from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import './Cart.css';

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

const Cart = () => {
  const { 
    cartItems, 
    totalPrice, 
    removeItemCompletely, 
    updateItemQuantity, 
    clearCart 
  } = useContext(CartContext);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activePedido, setActivePedido] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState(new Set());
  
  React.useEffect(() => {
    const fetchActivePedido = async () => {
      try {
        const response = await ApiService.pedidos.activo();
        if (response.data && response.data.pedido) {
          setActivePedido(response.data);
        }
      } catch (error) {
        console.error('Error al verificar pedido activo:', error);
      }
    };
    
    if (user) {
      fetchActivePedido();
    }
  }, [user]);
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  const handleImageError = (itemId, e) => {
    if (!imageErrors.has(itemId)) {
      setImageErrors(prev => new Set([...prev, itemId]));
      e.target.src = DEFAULT_IMAGE;
    }
  };
  
  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity > 0) {
      updateItemQuantity(id, newQuantity);
    }
  };
  
  const handleRemoveItem = (id) => {
    removeItemCompletely(id);
    setImageErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleCheckout = () => {
    if (activePedido) {
      setError('Ya tienes un pedido activo. Debes esperar a que sea entregado antes de crear uno nuevo.');
      return;
    }
    
    if (cartItems.length === 0) {
      setError('No hay productos en el carrito. Agrega algunos productos antes de proceder al pago.');
      return;
    }
    
    navigate('/cliente/checkout');
  };
  
  const goToActiveOrder = () => {
    if (activePedido && activePedido.pedido) {
      navigate(`/cliente/delivery-tracking/${activePedido.pedido.id}`);
    }
  };
  
  const viewProductDetails = (productId) => {
    navigate(`/cliente/producto/${productId}`);
  };
  
  return (
    <div className="cart-page">
      {activePedido && (
        <OrderActiveAlert 
          pedido={activePedido.pedido}
          onClick={goToActiveOrder}
        />
      )}
      
      <div className="cart-header">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft />
        </button>
        <h1>Mi Carrito</h1>
        {cartItems.length > 0 && (
          <button className="clear-cart-button" onClick={clearCart}>
            <FaTrash />
          </button>
        )}
      </div>
      
      {error && (
        <div className="cart-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}
      
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <FaShoppingCart />
          </div>
          <h2>Tu carrito está vacío</h2>
          <p>Agrega productos desde los restaurantes para comenzar a ordenar</p>
          <button className="explore-button" onClick={() => navigate('/cliente')}>
            Explorar restaurantes
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map(item => {
              const imageUrl = imageErrors.has(item.id) ? DEFAULT_IMAGE : getImageUrl(item);
              
              return (
                <div key={item.id} className="cart-item">
                  <div 
                    className="item-image" 
                    onClick={() => viewProductDetails(item.id)}
                  >
                    <img 
                      src={imageUrl}
                      alt={item.nombre || 'Producto'}
                      onError={(e) => handleImageError(item.id, e)}
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="item-info">
                    <div className="item-header">
                      <h3 onClick={() => viewProductDetails(item.id)}>
                        {item.nombre || 'Producto sin nombre'}
                      </h3>
                      <button 
                        className="remove-button"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Eliminar producto"
                        aria-label={`Eliminar ${item.nombre} del carrito`}
                      >
                        <FaTrash />
                      </button>
                    </div>
                    
                    <p className="item-price">{formatPrice(item.precio || 0)}</p>
                    
                    <div className="item-actions">
                      <div className="quantity-control">
                        <button 
                          className="quantity-button" 
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          title="Disminuir cantidad"
                          aria-label="Disminuir cantidad"
                        >
                          <FaMinus />
                        </button>
                        <span className="quantity" aria-label={`Cantidad: ${item.quantity}`}>
                          {item.quantity}
                        </span>
                        <button 
                          className="quantity-button"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          title="Aumentar cantidad"
                          aria-label="Aumentar cantidad"
                        >
                          <FaPlus />
                        </button>
                      </div>
                      
                      <span className="item-total">
                        {formatPrice((item.precio || 0) * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            
            <div className="summary-row">
              <span>Costo de entrega</span>
              <span>{formatPrice(5000)}</span>
            </div>
            
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatPrice(totalPrice + 5000)}</span>
            </div>
            
            <button 
              className="checkout-button"
              onClick={handleCheckout}
              disabled={loading || cartItems.length === 0}
            >
              {loading ? 'Procesando...' : 'Proceder al pago'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;