import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import '../../styles/Cart.css';

function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  
  // Subtotal y total
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Carga el carrito desde el localStorage
    const loadCart = () => {
      try {
        setLoading(true);
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          setCartItems(parsedCart);
          
          // Calcular subtotal
          const subtotalAmount = parsedCart.reduce((sum, item) => {
            return sum + (item.precio * item.quantity);
          }, 0);
          
          setSubtotal(subtotalAmount);
          
          // Establecer tarifa de entrega fija para simplificar
          const delivery = 2000; // 2000 pesos por la entrega
          setDeliveryFee(delivery);
          
          // Calcular total
          setTotal(subtotalAmount + delivery);
        }
      } catch (err) {
        console.error('Error al cargar el carrito:', err);
        setError('No se pudo cargar el carrito. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    // Cargar las direcciones del usuario (historial)
    const loadAddresses = () => {
      if (user && user.historialDirecciones) {
        setAddresses(user.historialDirecciones);
      } else {
        // Si no hay direcciones guardadas, usamos la principal
        setAddresses([{
          comuna: user?.comuna || 0,
          barrio: user?.barrio || '',
          direccionEspecifica: user?.direccion || ''
        }]);
      }
    };
    
    loadCart();
    loadAddresses();
  }, [user]);
  
  const handleQuantityChange = (index, change) => {
    const newCartItems = [...cartItems];
    const currentQuantity = newCartItems[index].quantity;
    
    // No permitir menos de 1 producto
    if (currentQuantity + change < 1) {
      return;
    }
    
    newCartItems[index].quantity = currentQuantity + change;
    
    // Actualizar carrito en localStorage
    localStorage.setItem('cart', JSON.stringify(newCartItems));
    setCartItems(newCartItems);
    
    // Actualizar subtotal y total
    const newSubtotal = newCartItems.reduce((sum, item) => {
      return sum + (item.precio * item.quantity);
    }, 0);
    
    setSubtotal(newSubtotal);
    setTotal(newSubtotal + deliveryFee);
  };
  
  const handleRemoveItem = (index) => {
    const newCartItems = [...cartItems];
    newCartItems.splice(index, 1);
    
    // Actualizar carrito en localStorage
    localStorage.setItem('cart', JSON.stringify(newCartItems));
    setCartItems(newCartItems);
    
    // Actualizar subtotal y total
    const newSubtotal = newCartItems.reduce((sum, item) => {
      return sum + (item.precio * item.quantity);
    }, 0);
    
    setSubtotal(newSubtotal);
    setTotal(newSubtotal + deliveryFee);
  };
  
  const handleCheckout = async () => {
    try {
      if (cartItems.length === 0) {
        setError('Tu carrito está vacío. Agrega productos para realizar el pedido.');
        return;
      }
      
      const selectedAddressData = addresses[selectedAddress];
      
      // Preparar los datos para el pedido
      const pedidoData = {
        direccionEntrega: {
          barrio: selectedAddressData.barrio,
          comuna: parseInt(selectedAddressData.comuna),
          direccionEspecifica: selectedAddressData.direccionEspecifica
        },
        productos: cartItems.map(item => ({
          productoId: item.id,
          cantidad: item.quantity
        }))
      };
      
      // Llamar a la API para crear el pedido
      const response = await api.post('/pedidos/crear', pedidoData);
      
      // Limpiar el carrito después de la compra exitosa
      localStorage.removeItem('cart');
      
      // Redireccionar a la página de confirmación o de pedidos
      navigate('/cliente/pedidos', { 
        state: { 
          success: true, 
          message: 'Pedido realizado con éxito' 
        } 
      });
      
    } catch (err) {
      console.error('Error al procesar el pedido:', err);
      
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Error al procesar el pedido');
      } else {
        setError('Error al conectar con el servidor. Intenta de nuevo más tarde.');
      }
    }
  };
  
  if (loading) {
    return <div className="loading-container">Cargando tu carrito...</div>;
  }
  
  if (error) {
    return <div className="error-container">{error}</div>;
  }
  
  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <h1 className="page-title">Mi Carrito</h1>
        
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2 className="empty-cart-message">Tu carrito está vacío</h2>
          <p className="empty-cart-subtext">¡Explora restaurantes y agrega productos para hacer tu pedido!</p>
          <Link to="/cliente" className="browse-button">Explorar restaurantes</Link>
        </div>
      </div>
    );
  }
  
  // Agrupar por restaurante para mostrar
  const groupedByRestaurant = {};
  cartItems.forEach(item => {
    if (!groupedByRestaurant[item.restaurante_Id]) {
      groupedByRestaurant[item.restaurante_Id] = {
        name: item.restauranteName || 'Restaurante',
        items: []
      };
    }
    groupedByRestaurant[item.restaurante_Id].items.push(item);
  });
  
  return (
    <div className="cart-page">
      <h1 className="page-title">Mi Carrito</h1>
      
      <div className="cart-content">
        <div className="cart-items">
          {Object.keys(groupedByRestaurant).map(restaurantId => (
            <div className="restaurant-group" key={restaurantId}>
              <div className="restaurant-header">
                <span className="restaurant-icon">🍽️</span>
                <span className="restaurant-name">{groupedByRestaurant[restaurantId].name}</span>
              </div>
              
              {groupedByRestaurant[restaurantId].items.map((item, index) => (
                <div className="cart-item" key={index}>
                  <img 
                    src={item.imageUrl || "https://via.placeholder.com/70?text=Food"}
                    alt={item.nombre} 
                    className="item-image" 
                  />
                  <div className="item-details">
                    <h3 className="item-name">{item.nombre}</h3>
                    {item.especificaciones && (
                      <p className="item-customization">{item.especificaciones}</p>
                    )}
                    <div className="item-actions">
                      <div className="quantity-control">
                        <button 
                          className="quantity-button"
                          onClick={() => handleQuantityChange(index, -1)}
                        >-</button>
                        <span className="quantity-value">{item.quantity}</span>
                        <button 
                          className="quantity-button"
                          onClick={() => handleQuantityChange(index, 1)}
                        >+</button>
                      </div>
                      <span className="item-price">${item.precio.toLocaleString()}</span>
                      <button 
                        className="remove-button"
                        onClick={() => handleRemoveItem(index)}
                      >Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        
        <div className="order-summary">
          <h2 className="summary-title">Resumen de tu pedido</h2>
          
          <div className="summary-list">
            <div className="summary-item">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span>Costo de envío</span>
              <span>${deliveryFee.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="summary-divider"></div>
          
          <div className="total-row">
            <span>Total</span>
            <span>${total.toLocaleString()}</span>
          </div>
          
          <div className="delivery-address">
            <div className="address-header">
              <span className="address-title">Dirección de entrega</span>
              <button className="change-address">Cambiar</button>
            </div>
            <div className="address-content">
              {addresses.length > 0 ? (
                <p>{addresses[selectedAddress].direccionEspecifica}, Comuna {addresses[selectedAddress].comuna}</p>
              ) : (
                <p>No hay direcciones guardadas. Por favor, agrega una.</p>
              )}
            </div>
          </div>
          
          <div className="payment-methods">
            <div className="method-title">Método de pago</div>
            <div className="method-options">
              <div 
                className={`method-option ${paymentMethod === 'efectivo' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('efectivo')}
              >
                <input 
                  type="radio" 
                  className="method-radio" 
                  checked={paymentMethod === 'efectivo'} 
                  onChange={() => setPaymentMethod('efectivo')}
                />
                <span className="method-label">Efectivo</span>
                <span className="method-icon">💵</span>
              </div>
              
              <div 
                className={`method-option ${paymentMethod === 'tarjeta' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('tarjeta')}
              >
                <input 
                  type="radio" 
                  className="method-radio" 
                  checked={paymentMethod === 'tarjeta'} 
                  onChange={() => setPaymentMethod('tarjeta')}
                />
                <span className="method-label">Tarjeta de crédito/débito</span>
                <span className="method-icon">💳</span>
              </div>
            </div>
          </div>
          
          <button 
            className="checkout-button" 
            onClick={handleCheckout}
          >
            Confirmar pedido
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;