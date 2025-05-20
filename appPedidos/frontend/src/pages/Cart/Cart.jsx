
// src/components/client/Cart.jssx
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaTrash, FaPlus, FaMinus, FaShoppingCart } from 'react-icons/fa';
import { CartContext } from '../../contexts/CartContext';
import OrderActiveAlert from '../../components/client/orderactivealert/OrderActiveAlert';
import ApiService from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import './Cart.css';

const DEFAULT_IMAGE = '/images/food-placeholder.jpg';

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
  
  // Verificar si hay un pedido activo
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
  
  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  // Manejar cambio de cantidad
  const handleQuantityChange = (id, newQuantity) => {
    if (newQuantity > 0) {
      updateItemQuantity(id, newQuantity);
    }
  };
  
  // Eliminar item del carrito
  const handleRemoveItem = (id) => {
    removeItemCompletely(id);
  };
  
  // Volver a la página anterior
  const handleBack = () => {
    navigate(-1);
  };
  
  // Proceder al checkout
  const handleCheckout = () => {
    // Verificar si ya hay un pedido activo
    if (activePedido) {
      setError('Ya tienes un pedido activo. Debes esperar a que sea entregado antes de crear uno nuevo.');
      return;
    }
    
    // Verificar si hay productos en el carrito
    if (cartItems.length === 0) {
      setError('No hay productos en el carrito. Agrega algunos productos antes de proceder al pago.');
      return;
    }
    
    // Ir a la página de checkout
    navigate('/cliente/checkout');
  };
  
  // Ir al seguimiento del pedido activo
  const goToActiveOrder = () => {
    if (activePedido && activePedido.pedido) {
      navigate(`/cliente/delivery-tracking/${activePedido.pedido.id}`);
    }
  };
  
  // Ver detalles de un producto
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
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <div 
                  className="item-image" 
                  onClick={() => viewProductDetails(item.id)}
                >
                  <img 
                    src={item.imagen || DEFAULT_IMAGE} 
                    alt={item.nombre}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_IMAGE;
                    }}
                  />
                </div>
                
                <div className="item-info">
                  <div className="item-header">
                    <h3 onClick={() => viewProductDetails(item.id)}>
                      {item.nombre}
                    </h3>
                    <button 
                      className="remove-button"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                  
                  <p className="item-price">{formatPrice(item.precio)}</p>
                  
                  <div className="item-actions">
                    <div className="quantity-control">
                      <button 
                        className="quantity-button" 
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        <FaMinus />
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        className="quantity-button"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        <FaPlus />
                      </button>
                    </div>
                    
                    <span className="item-total">
                      {formatPrice(item.precio * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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