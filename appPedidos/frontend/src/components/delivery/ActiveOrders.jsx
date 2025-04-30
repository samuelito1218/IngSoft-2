import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import '../../styles/ActiveOrders.css';

function ActiveOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    const fetchActiveOrders = async () => {
      try {
        setLoading(true);
        
        // En una implementación real, harías la llamada a la API
        // const response = await api.get('/repartidor/pedidos-activos');
        
        // Datos de muestra para probar la interfaz
        const mockOrders = [
          {
            id: '1',
            restaurante: {
              nombre: 'Burger Place',
              direccion: 'Calle 20 #15-35',
              telefono: '555-1234'
            },
            cliente: {
              nombre: 'Juan Pérez',
              direccion: 'Carrera 45 #80-27, Apto 502',
              telefono: '555-5678'
            },
            estado: 'Asignado',
            fechaCreacion: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            items: [
              { nombre: 'Hamburguesa Clásica', cantidad: 1 },
              { nombre: 'Papas Fritas', cantidad: 1 },
              { nombre: 'Refresco', cantidad: 1 }
            ],
            total: 25000,
            metodoPago: 'Efectivo',
            notas: 'Sin cebolla en la hamburguesa, por favor.'
          },
          {
            id: '2',
            restaurante: {
              nombre: 'Pizza Heaven',
              direccion: 'Avenida Principal #10-20',
              telefono: '555-4321'
            },
            cliente: {
              nombre: 'María Rodríguez',
              direccion: 'Calle 100 #15-20, Casa 5',
              telefono: '555-8765'
            },
            estado: 'En_Camino',
            fechaCreacion: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            items: [
              { nombre: 'Pizza Familiar Hawaiana', cantidad: 1 },
              { nombre: 'Palitos de Ajo', cantidad: 1 },
              { nombre: 'Gaseosa 1.5L', cantidad: 1 }
            ],
            total: 45000,
            metodoPago: 'Tarjeta',
            notas: 'Timbre no funciona, por favor llamar al llegar.'
          }
        ];
        
        setOrders(mockOrders);
        setError(null);
      } catch (err) {
        console.error('Error al cargar pedidos activos:', err);
        setError('No se pudieron cargar los pedidos activos. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchActiveOrders();
  }, [user.id]);
  
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // En una implementación real, harías la llamada a la API
      // await api.put(`/repartidor/pedidos/${orderId}/estado`, { estado: newStatus });
      
      console.log(`Actualizando pedido ${orderId} a estado ${newStatus}`);
      
      // Actualizar estado en la interfaz
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, estado: newStatus } 
          : order
      ));
      
      // Si estamos viendo los detalles de este pedido, actualizar también
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, estado: newStatus });
      }
      
      // Si el estado es "Entregado", podemos eliminarlo de la lista después de un tiempo
      if (newStatus === 'Entregado') {
        setTimeout(() => {
          setOrders(orders.filter(order => order.id !== orderId));
          if (showModal && selectedOrder && selectedOrder.id === orderId) {
            setShowModal(false);
          }
        }, 5000);
      }
    } catch (err) {
      console.error('Error al actualizar estado del pedido:', err);
      setError('No se pudo actualizar el estado. Inténtalo de nuevo.');
    }
  };
  
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
  };
  
  const filteredOrders = () => {
    if (activeFilter === 'all') {
      return orders;
    }
    
    return orders.filter(order => {
      if (activeFilter === 'assigned') {
        return order.estado === 'Asignado';
      } else if (activeFilter === 'pickup') {
        return order.estado === 'Recogido';
      } else if (activeFilter === 'delivery') {
        return order.estado === 'En_Camino';
      }
      return false;
    });
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'Asignado':
        return 'status-assigned';
      case 'Recogido':
        return 'status-picked';
      case 'En_Camino':
        return 'status-transit';
      default:
        return '';
    }
  };
  
  const formatDate = (dateString) => {
    const options = { 
      hour: '2-digit', 
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('es-CO', options);
  };
  
  if (loading) {
    return <div className="loading-container">Cargando pedidos activos...</div>;
  }
  
  if (error) {
    return <div className="error-container">{error}</div>;
  }
  
  if (orders.length === 0) {
    return (
      <div className="active-orders">
        <div className="page-header">
          <h1 className="page-title">Pedidos Activos</h1>
        </div>
        
        <div className="empty-orders">
          <div className="empty-icon">🚚</div>
          <h2 className="empty-title">No tienes pedidos activos</h2>
          <p className="empty-message">Ve al panel principal para aceptar nuevos pedidos disponibles</p>
          <button 
            className="refresh-button"
            onClick={() => window.location.reload()}
          >
            <span>🔄</span> Actualizar
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="active-orders">
      <div className="page-header">
        <h1 className="page-title">Pedidos Activos ({orders.length})</h1>
        
        <div className="filter-options">
          <button 
            className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Todos
          </button>
          <button 
            className={`filter-button ${activeFilter === 'assigned' ? 'active' : ''}`}
            onClick={() => setActiveFilter('assigned')}
          >
            Asignados
          </button>
          <button 
            className={`filter-button ${activeFilter === 'pickup' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pickup')}
          >
            Por recoger
          </button>
          <button 
            className={`filter-button ${activeFilter === 'delivery' ? 'active' : ''}`}
            onClick={() => setActiveFilter('delivery')}
          >
            En entrega
          </button>
        </div>
      </div>
      
      <div className="orders-grid">
        {filteredOrders().map(order => (
          <div className="order-card" key={order.id}>
            <div className="order-header">
              <div className="order-id">Pedido #{order.id}</div>
              <div className={`order-status ${getStatusClass(order.estado)}`}>{order.estado}</div>
            </div>
            
            <div className="order-body">
              <div className="locations">
                <div className="location-row">
                  <div className="location-icon pickup-icon">🏪</div>
                  <div className="location-details">
                    <div className="location-type">Recoger en</div>
                    <div className="location-name">{order.restaurante.nombre}</div>
                    <div className="location-address">{order.restaurante.direccion}</div>
                  </div>
                </div>
                
                <div className="location-row">
                  <div className="location-icon delivery-icon">📍</div>
                  <div className="location-details">
                    <div className="location-type">Entregar en</div>
                    <div className="location-address">{order.cliente.direccion}</div>
                  </div>
                </div>
              </div>
              
              <div className="order-details">
                <div className="detail-row">
                  <span className="detail-label">Items</span>
                  <span className="detail-value">{order.items.length} productos</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Tiempo</span>
                  <span className="detail-value">{formatDate(order.fechaCreacion)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total</span>
                  <span className="detail-value highlight">${order.total.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Pago</span>
                  <span className="detail-value">{order.metodoPago}</span>
                </div>
              </div>
              
              <div className="customer-details">
                <div className="customer-avatar">👤</div>
                <div className="customer-info">
                  <div className="customer-name">{order.cliente.nombre}</div>
                  <div className="customer-phone">📱 {order.cliente.telefono}</div>
                </div>
                <a href={`tel:${order.cliente.telefono}`} className="contact-button">📞</a>
              </div>
              
              <div className="order-actions">
                {order.estado === 'Asignado' && (
                  <button 
                    className="action-button primary-button"
                    onClick={() => updateOrderStatus(order.id, 'Recogido')}
                  >
                    Marcar como recogido
                  </button>
                )}
                
                {order.estado === 'Recogido' && (
                  <button 
                    className="action-button primary-button"
                    onClick={() => updateOrderStatus(order.id, 'En_Camino')}
                  >
                    Iniciar entrega
                  </button>
                )}
                
                {order.estado === 'En_Camino' && (
                  <button 
                    className="action-button primary-button"
                    onClick={() => updateOrderStatus(order.id, 'Entregado')}
                  >
                    Confirmar entrega
                  </button>
                )}
                
                <button 
                  className="action-button secondary-button"
                  onClick={() => viewOrderDetails(order)}
                >
                  Ver detalles
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {showModal && selectedOrder && (
        <div className="order-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Detalles del Pedido #{selectedOrder.id}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="order-items">
                <h3 className="items-title">Productos</h3>
                <div className="items-list">
                  {selectedOrder.items.map((item, index) => (
                    <div className="item-row" key={index}>
                      <div className="item-quantity">{item.cantidad}</div>
                      <div className="item-details">
                        <div className="item-name">{item.nombre}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="subtotal-row">
                  <span>Subtotal</span>
                  <span>${selectedOrder.total.toLocaleString()}</span>
                </div>
                
                <div className="total-row">
                  <span>Total</span>
                  <span>${selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>
              
              {selectedOrder.notas && (
                <div className="notes-section">
                  <h3 className="notes-title">Notas del cliente</h3>
                  <div className="notes-content">
                    {selectedOrder.notas}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="problem-button"
                onClick={() => console.log('Reportar problema con pedido:', selectedOrder.id)}
              >
                Reportar problema
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveOrders;