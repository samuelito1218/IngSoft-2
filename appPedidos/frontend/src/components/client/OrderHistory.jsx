import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import '../../styles/OrderHistory.css';

function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Simular carga de pedidos desde la API
        // En una implementación real, esto vendría de un endpoint
        
        // Datos de muestra para probar la interfaz
        const mockOrders = [
          {
            id: '1',
            restaurante: 'Burger Place',
            estado: 'Entregado',
            fechaDeCreacion: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            total: 15000,
            productos: [
              { nombre: 'Hamburguesa Clásica', cantidad: 1, precio: 10000 },
              { nombre: 'Papas Fritas', cantidad: 1, precio: 5000 }
            ],
            direccionEntrega: {
              direccionEspecifica: 'Calle 123 #45-67',
              barrio: 'Centro',
              comuna: 5
            }
          },
          {
            id: '2',
            restaurante: 'Pizza Heaven',
            estado: 'En_Camino',
            fechaDeCreacion: new Date().toISOString(),
            total: 25000,
            productos: [
              { nombre: 'Pizza Familiar', cantidad: 1, precio: 20000 },
              { nombre: 'Gaseosa 1.5L', cantidad: 1, precio: 5000 }
            ],
            direccionEntrega: {
              direccionEspecifica: 'Avenida Principal #10-20',
              barrio: 'Poblado',
              comuna: 10
            }
          }
        ];
        
        setOrders(mockOrders);
        
        // En una implementación real, se haría la llamada a la API:
        // const response = await api.get('/pedidos/historial');
        // setOrders(response.data);
        
        setError(null);
      } catch (err) {
        console.error('Error al cargar pedidos:', err);
        setError('No se pudieron cargar tus pedidos. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user.id]);

  const filteredOrders = () => {
    if (activeTab === 'all') {
      return orders;
    }
    
    return orders.filter(order => {
      if (activeTab === 'active') {
        return order.estado === 'Pendiente' || order.estado === 'En_Camino';
      } else if (activeTab === 'completed') {
        return order.estado === 'Entregado';
      }
      return false;
    });
  };

  const handleOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const handleReorder = async (orderId) => {
    try {
      // En una implementación real, se haría la llamada a la API
      // await api.post('/pedidos/reordenar/${orderId}');
      
      // Por ahora, mostramos un mensaje en consola
      console.log('Reordenando pedido ID:', orderId);
      
      // Y redirigimos al carrito
      // navigate('/cliente/carrito');
    } catch (err) {
      console.error('Error al reordenar:', err);
      setError('No se pudo reordenar. Por favor, intenta de nuevo más tarde.');
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-CO', options);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Entregado':
        return 'status-delivered';
      case 'En_Camino':
        return 'status-in-progress';
      case 'Pendiente':
        return 'status-in-progress';
      case 'Cancelado':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Entregado':
        return 'Entregado';
      case 'En_Camino':
        return 'En camino';
      case 'Pendiente':
        return 'Pendiente';
      case 'Cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="loading-container">Cargando pedidos...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="order-history">
        <h1 className="page-title">Mis Pedidos</h1>
        
        <div className="tabs-container">
          <div className="tabs">
            <div 
              className={`tab ${activeTab === 'all' ? 'active' : ''}`} 
              onClick={() => setActiveTab('all')}
            >
              Todos
            </div>
            <div 
              className={`tab ${activeTab === 'active' ? 'active' : ''}`} 
              onClick={() => setActiveTab('active')}
            >
              Activos
            </div>
            <div 
              className={`tab ${activeTab === 'completed' ? 'active' : ''}`} 
              onClick={() => setActiveTab('completed')}
            >
              Entregados
            </div>
          </div>
        </div>
        
        <div className="empty-orders">
          <div className="empty-icon">📋</div>
          <h2 className="empty-title">No tienes pedidos aún</h2>
          <p className="empty-message">¡Realiza tu primer pedido y disfruta de comida deliciosa a domicilio!</p>
          <Link to="/cliente" className="browse-button">Explorar restaurantes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history">
      <h1 className="page-title">Mis Pedidos</h1>
      
      <div className="tabs-container">
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`} 
            onClick={() => setActiveTab('all')}
          >
            Todos
          </div>
          <div 
            className={`tab ${activeTab === 'active' ? 'active' : ''}`} 
            onClick={() => setActiveTab('active')}
          >
            Activos
          </div>
          <div 
            className={`tab ${activeTab === 'completed' ? 'active' : ''}`} 
            onClick={() => setActiveTab('completed')}
          >
            Entregados
          </div>
        </div>
      </div>
      
      <div className="orders-list">
        {filteredOrders().map((order) => (
          <div className="order-card" key={order.id}>
            <div className="order-header">
              <div className="order-info">
                <div className="order-number">Pedido #{order.id}</div>
                <div className="order-date">{formatDate(order.fechaDeCreacion)}</div>
              </div>
              <div className={`order-status ${getStatusClass(order.estado)}`}>
                {getStatusLabel(order.estado)}
              </div>
            </div>
            
            <div className="order-content">
              <div className="restaurant-row">
                <span className="restaurant-icon">🍽️</span>
                <span className="restaurant-name">{order.restaurante}</span>
              </div>
              
              <div className="order-items">
                {order.productos.slice(0, 2).map((item, index) => (
                  <div className="order-item" key={index}>
                    <div className="item-name">
                      <span className="item-quantity">{item.cantidad}x</span> {item.nombre}
                    </div>
                    <div>${item.precio.toLocaleString()}</div>
                  </div>
                ))}
                
                {order.productos.length > 2 && (
                  <div className="order-item">
                    <div className="item-name">
                      <span className="item-quantity">...</span> {order.productos.length - 2} items más
                    </div>
                  </div>
                )}
              </div>
              
              <div className="order-total">
                <span>Total</span>
                <span>${order.total.toLocaleString()}</span>
              </div>
              
              <div className="order-actions">
                <button 
                  className="order-button detail-button"
                  onClick={() => handleOrderDetail(order)}
                >
                  Ver detalles
                </button>
                
                {order.estado === 'Entregado' && (
                  <button 
                    className="order-button reorder-button"
                    onClick={() => handleReorder(order.id)}
                  >
                    Pedir de nuevo
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {showModal && selectedOrder && (
        <div className="order-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Detalle del Pedido #{selectedOrder.id}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="order-detail-section">
                <h3>Estado del Pedido</h3>
                <div className={`order-status ${getStatusClass(selectedOrder.estado)}`}>
                  {getStatusLabel(selectedOrder.estado)}
                </div>
                <p className="order-date">{formatDate(selectedOrder.fechaDeCreacion)}</p>
              </div>
              
              <div className="order-detail-section">
                <h3>Restaurante</h3>
                <p>{selectedOrder.restaurante}</p>
              </div>
              
              <div className="order-detail-section">
                <h3>Productos</h3>
                <div className="detail-products">
                  {selectedOrder.productos.map((item, index) => (
                    <div className="detail-product-item" key={index}>
                      <div className="product-name">
                        <span className="product-quantity">{item.cantidad}x</span> 
                        {item.nombre}
                      </div>
                      <div className="product-price">${item.precio.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="order-detail-section">
                <h3>Dirección de entrega</h3>
                <p>
                  {selectedOrder.direccionEntrega.direccionEspecifica}, 
                  {selectedOrder.direccionEntrega.barrio}, 
                  Comuna {selectedOrder.direccionEntrega.comuna}
                </p>
              </div>
              
              <div className="order-detail-section">
                <h3>Resumen de pago</h3>
                <div className="payment-summary">
                  <div className="payment-row">
                    <span>Subtotal</span>
                    <span>${selectedOrder.total - 2000}</span>
                  </div>
                  <div className="payment-row">
                    <span>Envío</span>
                    <span>$2,000</span>
                  </div>
                  <div className="payment-row total">
                    <span>Total</span>
                    <span>${selectedOrder.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderHistory;