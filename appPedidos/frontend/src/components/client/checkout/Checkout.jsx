// src/components/client/Checkout.jsx
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCreditCard, FaMoneyBillWave, FaMapMarkerAlt, FaSave } from 'react-icons/fa';
import { CartContext } from '../../../contexts/CartContext';
import { useAuth } from '../../../hooks/useAuth';
import ApiService from '../../../services/api';
import './Checkout.css';

const Checkout = () => {
  const { cartItems, totalPrice, clearCart } = useContext(CartContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1); // 1: Dirección, 2: Método de pago, 3: Confirmación
  const [success, setSuccess] = useState(false);
  const [pedidoId, setPedidoId] = useState(null);
  
  // Estado para dirección de entrega
  const [direccion, setDireccion] = useState({
    barrio: '',
    comuna: '',
    direccionEspecifica: ''
  });
  
  // Estado para método de pago
  const [metodoPago, setMetodoPago] = useState('efectivo');
  
  // Estado para guardar dirección
  const [guardaDireccion, setGuardaDireccion] = useState(false);
  
  // Estado para direcciones guardadas
  const [direccionesGuardadas, setDireccionesGuardadas] = useState([]);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
  
  // Verificar si hay productos en el carrito
  useEffect(() => {
    if (cartItems.length === 0 && !success) {
      navigate('/cliente/carrito');
    }
  }, [cartItems, navigate, success]);
  
  // Cargar direcciones guardadas
  useEffect(() => {
    const fetchDirecciones = async () => {
      try {
        if (user) {
          const response = await ApiService.usuarios.direcciones();
          if (response.data && Array.isArray(response.data)) {
            setDireccionesGuardadas(response.data);
          }
        }
      } catch (error) {
        console.error('Error al cargar direcciones guardadas:', error);
      }
    };
    
    fetchDirecciones();
  }, [user]);
  
  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  // Manejar cambio en formulario de dirección
  const handleDireccionChange = (e) => {
    const { name, value } = e.target;
    setDireccion(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  // Seleccionar una dirección guardada
  const handleDireccionSelect = (direccion) => {
    setDireccion(direccion);
    setDireccionSeleccionada(direccion);
  };
  
  // Manejar cambio en método de pago
  const handleMetodoPagoChange = (metodo) => {
    setMetodoPago(metodo);
  };
  
  // Validar formulario de dirección
  const validarDireccion = () => {
    if (!direccion.barrio.trim()) {
      setError('El barrio es obligatorio');
      return false;
    }
    
    if (!direccion.comuna) {
      setError('La comuna es obligatoria');
      return false;
    }
    
    if (!direccion.direccionEspecifica.trim()) {
      setError('La dirección específica es obligatoria');
      return false;
    }
    
    return true;
  };
  
  // Continuar al siguiente paso
  const handleContinuar = () => {
    setError(null);
    
    if (step === 1) {
      if (validarDireccion()) {
        setStep(2);
      }
    } else if (step === 2) {
      setStep(3);
    }
  };
  
  // Volver al paso anterior
  const handleVolver = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/cliente/carrito');
    }
  };
  
  // Confirmar pedido
  const handleConfirmarPedido = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Crear estructura de datos para el pedido
      const productos = cartItems.map(item => ({
        productoId: item.id,
        cantidad: item.quantity
      }));
      
      const pedidoData = {
        direccionEntrega: direccion,
        productos,
        metodoPago
      };
      
      // Guardar dirección si se seleccionó la opción
      if (guardaDireccion && user) {
        try {
          await ApiService.usuarios.guardarDireccion({ direccion });
        } catch (dirError) {
          console.error('Error al guardar dirección:', dirError);
          // No interrumpir el flujo si falla el guardado de dirección
        }
      }
      
      // Enviar pedido al backend
      const response = await ApiService.pedidos.crear(pedidoData);
      
      if (response.data && response.data.id) {
        setPedidoId(response.data.id);
        setSuccess(true);
        clearCart(); // Limpiar carrito después de crear el pedido
        
        // Si el método de pago es tarjeta, proceder al pago
        if (metodoPago === 'tarjeta') {
          try {
            // Crear intención de pago
            const pagoResponse = await ApiService.pagos.crearIntencion(response.data.id);
            if (pagoResponse.data && pagoResponse.data.clientSecret) {
              // Redirigir a la página de pago
              navigate(`/cliente/pago/${response.data.id}`, {
                state: { clientSecret: pagoResponse.data.clientSecret }
              });
              return;
            }
          } catch (pagoError) {
            console.error('Error al crear intención de pago:', pagoError);
            // Continuar mostrando éxito aunque falle el pago
          }
        }
      } else {
        throw new Error('Error al crear el pedido');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al confirmar pedido:', error);
      setError('Error al confirmar el pedido. Inténtalo de nuevo.');
      setLoading(false);
    }
  };
  
  // Ver detalles del pedido creado
  const verPedido = () => {
    if (pedidoId) {
      navigate(`/cliente/delivery-tracking/${pedidoId}`);
    }
  };
  
  // Volver a la página de inicio
  const volverInicio = () => {
    navigate('/cliente');
  };
  
  // Renderizar paso actual
  const renderPaso = () => {
    // Si el pedido fue exitoso, mostrar mensaje de éxito
    if (success) {
      return (
        <div className="checkout-success">
          <div className="success-icon">✓</div>
          <h2>¡Pedido confirmado!</h2>
          <p>Tu pedido ha sido creado exitosamente.</p>
          
          {metodoPago === 'efectivo' ? (
            <p className="payment-info">Recuerda tener el efectivo listo para cuando llegue tu pedido.</p>
          ) : (
            <p className="payment-info">El pago con tarjeta será procesado durante la entrega.</p>
          )}
          
          <div className="success-actions">
            <button className="primary-button" onClick={verPedido}>
              Ver estado del pedido
            </button>
            <button className="secondary-button" onClick={volverInicio}>
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }
    
    switch (step) {
      case 1:
        return (
          <div className="checkout-step">
            <h2>Dirección de entrega</h2>
            
            {direccionesGuardadas.length > 0 && (
              <div className="direcciones-guardadas">
                <h3>Direcciones guardadas</h3>
                <div className="direcciones-list">
                  {direccionesGuardadas.map((dir, index) => (
                    <div 
                      key={index} 
                      className={`direccion-item ${direccionSeleccionada === dir ? 'selected' : ''}`}
                      onClick={() => handleDireccionSelect(dir)}
                    >
                      <div className="direccion-icon">
                        <FaMapMarkerAlt />
                      </div>
                      <div className="direccion-info">
                        <p>{dir.direccionEspecifica}</p>
                        <p className="direccion-detalle">
                          {dir.barrio}, Comuna {dir.comuna}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="checkout-form">
              <div className="form-group">
                <label htmlFor="barrio">Barrio</label>
                <input
                  type="text"
                  id="barrio"
                  name="barrio"
                  value={direccion.barrio}
                  onChange={handleDireccionChange}
                  placeholder="Ej. El Caney"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="comuna">Comuna</label>
                <select
                  id="comuna"
                  name="comuna"
                  value={direccion.comuna}
                  onChange={handleDireccionChange}
                  required
                >
                  <option value="">Selecciona la comuna</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map(num => (
                    <option key={num} value={num}>Comuna {num}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="direccionEspecifica">Dirección específica</label>
                <input
                  type="text"
                  id="direccionEspecifica"
                  name="direccionEspecifica"
                  value={direccion.direccionEspecifica}
                  onChange={handleDireccionChange}
                  placeholder="Ej. Calle 42 # 83-25, Apto 302"
                  required
                />
              </div>
              
              <div className="form-check">
                <input
                  type="checkbox"
                  id="guardarDireccion"
                  checked={guardaDireccion}
                  onChange={() => setGuardaDireccion(!guardaDireccion)}
                />
                <label htmlFor="guardarDireccion">
                  <FaSave /> Guardar esta dirección para futuros pedidos
                </label>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="checkout-step">
            <h2>Método de pago</h2>
            
            <div className="metodos-pago">
              <div 
                className={`metodo-pago ${metodoPago === 'efectivo' ? 'selected' : ''}`}
                onClick={() => handleMetodoPagoChange('efectivo')}
              >
                <div className="metodo-icon">
                  <FaMoneyBillWave />
                </div>
                <div className="metodo-info">
                  <h3>Efectivo</h3>
                  <p>Paga en efectivo al recibir tu pedido</p>
                </div>
              </div>
              
              <div 
                className={`metodo-pago ${metodoPago === 'tarjeta' ? 'selected' : ''}`}
                onClick={() => handleMetodoPagoChange('tarjeta')}
              >
                <div className="metodo-icon">
                  <FaCreditCard />
                </div>
                <div className="metodo-info">
                  <h3>Tarjeta de crédito/débito</h3>
                  <p>Paga con tarjeta al confirmar tu pedido</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="checkout-step">
            <h2>Confirmar pedido</h2>
            
            <div className="resumen-pedido">
              <div className="resumen-seccion">
                <h3>Dirección de entrega</h3>
                <div className="resumen-info">
                  <p>{direccion.direccionEspecifica}</p>
                  <p>{direccion.barrio}, Comuna {direccion.comuna}</p>
                </div>
              </div>
              
              <div className="resumen-seccion">
                <h3>Método de pago</h3>
                <div className="resumen-info">
                  <p>
                    {metodoPago === 'efectivo' ? (
                      <>
                        <FaMoneyBillWave /> Efectivo
                      </>
                    ) : (
                      <>
                        <FaCreditCard /> Tarjeta de crédito/débito
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="resumen-seccion">
                <h3>Productos</h3>
                <div className="resumen-productos">
                  {cartItems.map(item => (
                    <div key={item.id} className="resumen-producto">
                      <div className="producto-info">
                        <p className="producto-nombre">{item.nombre}</p>
                        <p className="producto-cantidad">x{item.quantity}</p>
                      </div>
                      <p className="producto-precio">
                        {formatPrice(item.precio * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="resumen-total">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                
                <div className="total-row">
                  <span>Costo de entrega</span>
                  <span>{formatPrice(5000)}</span>
                </div>
                
                <div className="total-row final">
                  <span>Total</span>
                  <span>{formatPrice(totalPrice + 5000)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <button className="back-button" onClick={handleVolver} disabled={loading || success}>
          <FaArrowLeft />
        </button>
        <h1>Checkout</h1>
      </div>
      
      {!success && (
        <div className="checkout-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Dirección</span>
          </div>
          
          <div className="progress-connector"></div>
          
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Pago</span>
          </div>
          
          <div className="progress-connector"></div>
          
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Confirmar</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="checkout-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}
      
      <div className="checkout-content">
        {renderPaso()}
      </div>
      
      {!success && (
        <div className="checkout-actions">
          <button 
            className="back-button-text" 
            onClick={handleVolver}
            disabled={loading}
          >
            Volver
          </button>
          
          {step < 3 ? (
            <button 
              className="continue-button" 
              onClick={handleContinuar}
              disabled={loading}
            >
              Continuar
            </button>
          ) : (
            <button 
              className="confirm-button" 
              onClick={handleConfirmarPedido}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Confirmar pedido'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Checkout;