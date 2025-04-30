import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import '../../styles/OrderManagement.css';

function OrderManagement() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        
        // En una implementación real, harías la llamada a la API
        // const response = await api.get(`/restaurante/pedidos?tab=${activeTab}`);
        
        // Datos de muestra para probar la interfaz
        const mockOrders = [
          {
            id: '1',
            cliente: {
              nombre: 'Juan Pérez',
              telefono: '555-1234',
              email: 'juan@example.com'
            },
            items: [
              { nombre: 'Hamburguesa Especial', cantidad: 1, precio: 15000 },
              { nombre: 'Papas Fritas Grande', cantidad: 1, precio: 8000 },
              { nombre: 'Refresco', cantidad: 1, precio: 5000 }
            ],
            fechaCreacion: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            estado: 'Pendiente',
            direccionEntrega: 'Calle 123 #45-67, Apto 502',
            metodoPago: 'Efectivo',
            total: 28000,
            notas: 'Sin cebolla en la hamburguesa, por favor.',
            timeline: [
              { estado: 'Creado', fecha: new Date(Date.now() - 15 * 60 * 1000).toISOString() }
            ],
            repartidor: null
          },
          {
            id: '2',
            cliente: {
              nombre: 'María Rodríguez',
              telefono: '555-5678',
              email: 'maria@example.com'
            },
            items: [
              { nombre: 'Pizza Familiar Hawaiana', cantidad: 1, precio: 35000 },
              { nombre: 'Palitos de Ajo', cantidad: 1, precio: 7000 }
            ],
            fechaCreacion: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            estado: 'Preparando',
            direccionEntrega: 'Avenida Principal #10-20, Casa 5',
            metodoPago: 'Tarjeta',
            total: 42000,
            notas: '',
            timeline: [
              { estado: 'Creado', fecha: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
              { estado: 'Confirmado', fecha: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
              { estado: 'Preparando', fecha: new Date(Date.now() - 30 * 60 * 1000).toISOString() }
            ],
            repartidor: null
          },
          {
            id: '3',
            cliente: {
              nombre: 'Carlos Santos',
              telefono: '555-9012',
              email: 'carlos@example.com'
            },
            items: [
              { nombre: 'Combo Sushi 24 piezas', cantidad: 1, precio: 45000 }
            ],
            fechaCreacion: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
            estado: 'Listo',
            direccionEntrega: 'Carrera 30 #15-40',
            metodoPago: 'Efectivo',
            total: 45000,
            notas: 'Incluir palillos extra y wasabi adicional.',
            timeline: [
              { estado: 'Creado', fecha: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
              { estado: 'Confirmado', fecha: new Date(Date.now() - 85 * 60 * 1000).toISOString() },
              { estado: 'Preparando', fecha: new Date(Date.now() - 70 * 60 * 1000).toISOString() },
              { estado: 'Listo', fecha: new Date(Date.now() - 20 * 60 * 1000).toISOString() }
            ],
            repartidor: {
              nombre: 'Pedro Díaz',
              telefono: '555-3456'
            }
          },
          {
            id: '4',
            cliente: {
              nombre: 'Diana Martínez',
              telefono: '555-7890',
              email: 'diana@example.com'
            },
            items: [
              { nombre: 'Ensalada César con Pollo', cantidad: 1, precio: 18000 },
              { nombre: 'Agua Mineral', cantidad: 1, precio: 3000 }
            ],
            fechaCreacion: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
            estado: 'Entregado',
            direccionEntrega: 'Calle 80 #20-30, Oficina 302',
            metodoPago: 'Tarjeta',
            total: 21000,
            notas: 'El aderezo aparte, por favor.',
            timeline: [
              { estado: 'Creado', fecha: new Date(Date.now() - 120 * 60 * 1000).toISOString() },
              { estado: 'Confirmado', fecha: new Date(Date.now() - 115 * 60 * 1000).toISOString() },
              { estado: 'Preparando', fecha: new Date(Date.now() - 100 * 60 * 1000).toISOString() },
              { estado: 'Listo', fecha: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
              { estado: 'En Camino', fecha: new Date(Date.now() - 75 * 60 * 1000).toISOString() },
              { estado: 'Entregado', fecha: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
            ],
            repartidor: {
              nombre: 'Luis González',
              telefono: '555-2345'
            }
          }
        ];
        
        // Filtrar órdenes según la pestaña activa
        let filteredOrders;
        
        if (activeTab === 'new') {
          filteredOrders = mockOrders.filter(o => o.estado === 'Pendiente');
        } else if (activeTab === 'processing') {
          filteredOrders = mockOrders.filter(o => o.estado === 'Preparando');
        } else if (activeTab === 'ready') {
          filteredOrders = mockOrders.filter(o => o.estado === 'Listo');
        } else if (activeTab === 'history') {
          filteredOrders = mockOrders.filter(o => o.estado === 'Entregado' || o.estado === 'Cancelado');
        } else {
          filteredOrders = mockOrders;
        }
        
        setOrders(filteredOrders);
        setError(null);
      } catch (err) {
        console.error('Error al cargar pedidos:', err);
        setError('No se pudieron cargar los pedidos. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [user.id, activeTab]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    
    // En una implementación real, harías la llamada a la API
    // const response = await api.get(`/restaurante/pedidos?query=${searchQuery}`);
    
    console.log('Buscando:', searchQuery);
    
    // Por ahora, solo filtramos los pedidos que ya tenemos
  };
  
  const updateOrderStatus = async (orderId, newStatusValue) => {
    try {
      // En una implementación real, harías la llamada a la API
      // await api.put(`/restaurante/pedidos/${orderId}/estado`, { estado: newStatusValue });
      
      console.log(`Actualizando pedido ${orderId} a estado ${newStatusValue}`);
      
      // Actualizar estado en la interfaz
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { 
              ...order, 
              estado: newStatusValue,
              timeline: [...order.timeline, { estado: newStatusValue, fecha: new Date().toISOString() }]
            } 
          : order
      ));
      
      // Si estamos viendo los detalles de este pedido, actualizar también
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ 
          ...selectedOrder, 
          estado: newStatusValue,
          timeline: [...selectedOrder.timeline, { estado: newStatusValue, fecha: new Date().toISOString() }]
        });
      }
      
      // Cerrar el dropdown de estado
      setShowStatusDropdown(false);
    } catch (err) {
      console.error('Error al actualizar estado del pedido:', err);
      setError('No se pudo actualizar el estado. Inténtalo de nuevo.');
    }
  };
  
  const handleAcceptOrder = (orderId) => {
    updateOrderStatus(orderId, 'Preparando');
  };
  
  const handleRejectOrder = (orderId) => {
    updateOrderStatus(orderId, 'Cancelado');
  };
  
  const handleOrderReady = (orderId) => {
    updateOrderStatus(orderId, 'Listo');
  };
  
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };
  
  const closeModal = () => {
    setShowModal(false);
    setNewStatus('');
  };
  
  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'Pendiente':
        return 'Preparando';
      case 'Preparando':
        return 'Listo';
      case 'Listo':
        return 'En Camino';
      case 'En Camino':
        return 'Entregado';
      default:
        return '';
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'Pendiente':
        return 'status-new';
      case 'Preparando':
        return 'status-processing';
      case 'Listo':
        return 'status-ready';
      case 'En Camino':
        return 'status-processing';
      case 'Entregado':
        return 'status-delivered';
      case 'Cancelado':
        return 'status-cancelled';
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
  
  const getOrderStatusCounts = () => {
    // En una implementación real, esto podría venir de la API
    return {
      new: 1,
      processing: 1,
      ready: 1,
      history: 1
    };
  };
  
  const counts = getOrderStatusCounts();
  
  if (loading) {
    return <div className="loading-container">Cargando pedidos...</div>;
  }
  
  if (error) {
    return <div className="error-container">{error}</div>;
  }
  
  return (
    <div className="order-management">
      <div className="page-header">
        <h1 className="page-title">Gestión de Pedidos</h1>
        
        <div className="filter-options">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="processing">En preparación</option>
            <option value="ready">Listos</option>
            <option value="delivered">Entregados</option>
            <option value="cancelled">Cancelados</option>
          </select>
          
          <form className="search-container" onSubmit={handleSearch}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Buscar por cliente o ID" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-button">🔍</button>
          </form>
        </div>
      </div>
      
      <div className="orders-tabs">
        <div 
          className={`order-tab ${activeTab === 'new' ? 'active' : ''}`}
          onClick={() => setActiveTab('new')}
        >
          Nuevos
          <span className="tab-count">{counts.new}</span>
        </div>
        <div 
          className={`order-tab ${activeTab === 'processing' ? 'active' : ''}`}
          onClick={() => setActiveTab('processing')}
        >
          En preparación
          <span className="tab-count">{counts.processing}</span>
        </div>
        <div 
          className={`order-tab ${activeTab === 'ready' ? 'active' : ''}`}
          onClick={() => setActiveTab('ready')}
        >
          Listos para entrega
          <span className="tab-count">{counts.ready}</span>
        </div>
        <div 
          className={`order-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Historial
          <span className="tab-count">{counts.history}</span>
        </div>
      </div>
      
      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3 className="empty-title">No hay pedidos en esta categoría</h3>
          <p className="empty-description">Cuando recibas pedidos {activeTab === 'new' ? 'nuevos' : activeTab === 'processing' ? 'en preparación' : activeTab === 'ready' ? 'listos' : 'completados'}, aparecerán aquí.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map(order => (
            <div className="order-card" key={order.id}>
              <div className="order-header">
                <div className="order-id">Pedido #{order.id}</div>
                <div className="order-time">{formatDate(order.fechaCreacion)}</div>
                <div className={`order-status ${getStatusClass(order.estado)}`}>{order.estado}</div>
              </div>
              
              <div className="order-body">
                <div className="customer-info">
                  <div className="customer-avatar">{order.cliente.nombre.charAt(0)}</div>
                  <div className="customer-details">
                    <div className="customer-name">{order.cliente.nombre}</div>
                    <div className="customer-contact">
                      <div className="contact-item">
                        <span>📞</span> {order.cliente.telefono}
                      </div>
                      <button className="contact-button">Llamar</button>
                    </div>
                  </div>
                </div>
                
                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div className="item-row" key={index}>
                      <div className="item-name">
                        <span className="item-quantity">{item.cantidad}x</span> {item.nombre}
                      </div>
                      <div className="item-price">${item.precio.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
                
                <div className="order-total">
                  <span>Total</span>
                  <span>${order.total.toLocaleString()}</span>
                </div>
                
                <div className="delivery-info">
                  <div className="info-title">Dirección de entrega</div>
                  <div className="delivery-address">{order.direccionEntrega}</div>
                </div>
                
                <div className="order-actions">
                  {order.estado === 'Pendiente' && (
                    <>
                      <button 
                        className="action-button accept-button"
                        onClick={() => handleAcceptOrder(order.id)}
                      >
                        Aceptar
                      </button>
                      <button 
                        className="action-button reject-button"
                        onClick={() => handleRejectOrder(order.id)}
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  
                  {order.estado === 'Preparando' && (
                    <button 
                      className="action-button ready-button"
                      onClick={() => handleOrderReady(order.id)}
                    >
                      Marcar como listo
                    </button>
                  )}
                  
                  <button 
                    className="action-button view-button"
                    onClick={() => viewOrderDetails(order)}
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showModal && selectedOrder && (
        <div className="order-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Detalles del Pedido #{selectedOrder.id}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="order-detail-grid">
                <div className="detail-section">
                  <div className="detail-title">
                    <span className="section-icon">👤</span> 
                    Información del cliente
                  </div>
                  <div className="detail-content">
                    <div className="customer-details">
                      <div className="detail-row">
                        <div className="detail-label">Nombre</div>
                        <div className="detail-value">{selectedOrder.cliente.nombre}</div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Teléfono</div>
                        <div className="detail-value">{selectedOrder.cliente.telefono}</div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Email</div>
                        <div className="detail-value">{selectedOrder.cliente.email}</div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Dirección</div>
                        <div className="detail-value">{selectedOrder.direccionEntrega}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <div className="detail-title">
                    <span className="section-icon">📦</span> 
                    Detalles del pedido
                  </div>
                  <div className="detail-content">
                    <div className="customer-details">
                      <div className="detail-row">
                        <div className="detail-label">Fecha</div>
                        <div className="detail-value">{formatDate(selectedOrder.fechaCreacion)}</div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Estado</div>
                        <div className="detail-value">
                          <span className={`order-status ${getStatusClass(selectedOrder.estado)}`}>
                            {selectedOrder.estado}
                          </span>
                        </div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Método de pago</div>
                        <div className="detail-value">{selectedOrder.metodoPago}</div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Repartidor</div>
                        <div className="detail-value">
                          {selectedOrder.repartidor 
                            ? `${selectedOrder.repartidor.nombre} (${selectedOrder.repartidor.telefono})` 
                            : 'No asignado aún'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <div className="detail-title">
                    <span className="section-icon">🍽️</span> 
                    Productos
                  </div>
                  <div className="detail-content">
                    <div className="items-list">
                      {selectedOrder.items.map((item, index) => (
                        <div className="detail-item" key={index}>
                          <div className="item-detail">
                            <div className="item-name">{item.nombre}</div>
                            <div className="item-variant">Cantidad: {item.cantidad}</div>
                          </div>
                          <div className="item-total">${item.precio.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="cost-summary">
                      <div className="cost-row">
                        <span>Subtotal</span>
                        <span>${selectedOrder.total.toLocaleString()}</span>
                      </div>
                      <div className="cost-row">
                        <span>Impuestos</span>
                        <span>Incluidos</span>
                      </div>
                      <div className="cost-row total">
                        <span>Total</span>
                        <span>${selectedOrder.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <div className="detail-title">
                    <span className="section-icon">📝</span> 
                    Notas del cliente
                  </div>
                  <div className="detail-content">
                    {selectedOrder.notas 
                      ? selectedOrder.notas 
                      : 'No hay notas para este pedido.'}
                  </div>
                </div>
              </div>
              
              <div className="order-timeline">
                <div className="detail-title">
                  <span className="section-icon">⏱️</span> 
                  Cronología del pedido
                </div>
                <div className="timeline-container">
                  {selectedOrder.timeline.map((event, index) => (
                    <div className="timeline-item" key={index}>
                      <div className={`timeline-dot ${index === selectedOrder.timeline.length - 1 ? 'active' : ''}`}>
                        {index + 1}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-title">{event.estado}</div>
                        <div className="timeline-time">{formatDate(event.fecha)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="print-button"
                onClick={() => window.print()}
              >
                <span>🖨️</span> Imprimir pedido
              </button>
              
              {selectedOrder.estado !== 'Entregado' && selectedOrder.estado !== 'Cancelado' && (
                <div className="status-dropdown">
                  <button 
                    className="update-button"
                    onClick={() => updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.estado))}
                  >
                    <span>🔄</span> Actualizar a {getNextStatus(selectedOrder.estado)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderManagement;