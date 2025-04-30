import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import '../../styles/DeliveryDashboard.css';

function DeliveryDashboard() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({
    today: {
      deliveries: 0,
      earnings: 0,
      rating: 0
    },
    week: {
      deliveries: 0,
      earnings: 0,
      rating: 0
    },
    month: {
      deliveries: 0,
      earnings: 0,
      rating: 0
    }
  });
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // En una implementación real, estas serían llamadas a la API
        // const statsResponse = await api.get('/repartidor/stats');
        // const ordersResponse = await api.get('/repartidor/pedidos-disponibles');
        // const activeOrdersResponse = await api.get('/repartidor/pedidos-activos');
        // const deliveriesResponse = await api.get('/repartidor/entregas-recientes');
        // const reviewsResponse = await api.get('/repartidor/reviews');
        
        // Datos de muestra para simular la respuesta de la API
        const mockStats = {
          today: {
            deliveries: 5,
            earnings: 25000,
            rating: 4.8
          },
          week: {
            deliveries: 32,
            earnings: 180000,
            rating: 4.7
          },
          month: {
            deliveries: 120,
            earnings: 650000,
            rating: 4.6
          }
        };
        
        const mockAvailableOrders = [
          {
            id: '1',
            restaurante: 'Burger Place',
            direccion: 'Calle 123 #45-67',
            distancia: 2.3,
            valor: 15000
          },
          {
            id: '2',
            restaurante: 'Pizza Heaven',
            direccion: 'Avenida Principal #10-20',
            distancia: 3.5,
            valor: 25000
          }
        ];
        
        const mockActiveOrders = [
          {
            id: '3',
            restaurante: 'Sushi World',
            cliente: 'Juan Pérez',
            direccion: 'Carrera 30 #15-40',
            estado: 'En camino',
            valor: 30000
          }
        ];
        
        const mockRecentDeliveries = [
          {
            id: '4',
            fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            restaurante: 'Taco House',
            valor: 22000,
            estado: 'Completado'
          },
          {
            id: '5',
            fecha: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            restaurante: 'China Express',
            valor: 18000,
            estado: 'Completado'
          }
        ];
        
        const mockReviews = [
          {
            id: '1',
            cliente: 'María González',
            fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            calificacion: 5,
            comentario: 'Excelente servicio, muy puntual y amable.'
          },
          {
            id: '2',
            cliente: 'Carlos Rodríguez',
            fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            calificacion: 4,
            comentario: 'Buena entrega, llegó a tiempo.'
          }
        ];
        
        setStats(mockStats);
        setAvailableOrders(mockAvailableOrders);
        setActiveOrders(mockActiveOrders);
        setRecentDeliveries(mockRecentDeliveries);
        setReviews(mockReviews);
        
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('No se pudieron cargar los datos. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user.id]);

  const toggleStatus = async () => {
    try {
      // En un caso real, aquí harías un llamado a la API para cambiar el estado
      // await api.post('/repartidor/cambiar-estado', { online: !isOnline });
      
      setIsOnline(!isOnline);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError('No se pudo cambiar tu estado. Inténtalo de nuevo.');
    }
  };

  const acceptOrder = async (orderId) => {
    try {
      // En un caso real, aquí harías un llamado a la API
      // await api.post(`/repartidor/aceptar-pedido/${orderId}`);
      
      console.log('Aceptando pedido ID:', orderId);
      
      // Simular la actualización del estado
      const order = availableOrders.find(o => o.id === orderId);
      if (order) {
        setActiveOrders([...activeOrders, {...order, estado: 'Asignado'}]);
        setAvailableOrders(availableOrders.filter(o => o.id !== orderId));
      }
    } catch (err) {
      console.error('Error al aceptar pedido:', err);
      setError('No se pudo aceptar el pedido. Inténtalo de nuevo.');
    }
  };
  
  const formatDate = (dateString) => {
    const options = { 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('es-CO', options);
  };
  
  if (loading) {
    return <div className="loading-container">Cargando dashboard...</div>;
  }
  
  if (error) {
    return <div className="error-container">{error}</div>;
  }
  
  return (
    <div className="delivery-dashboard">
      <div className="status-banner">
        <div className="status-info">
          <div className="status-avatar">{user.vehiculo === 'Moto' ? '🏍️' : '🚲'}</div>
          <div className="status-details">
            <h2 className="greeting">¡Hola, {user.nombreCompleto}!</h2>
            <div className="status-text">
              <span className={`status-indicator ${isOnline ? 'indicator-online' : 'indicator-offline'}`}></span>
              {isOnline ? 'Estás disponible para recibir pedidos' : 'No estás disponible actualmente'}
            </div>
          </div>
        </div>
        <div className="toggle-container">
          <span className="toggle-label">Cambiar estado</span>
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={isOnline} 
              onChange={toggleStatus} 
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon deliveries-icon">🚚</div>
          <div className="stat-value">{stats.today.deliveries}</div>
          <div className="stat-label">Entregas hoy</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon earnings-icon">💰</div>
          <div className="stat-value">${stats.today.earnings.toLocaleString()}</div>
          <div className="stat-label">Ganancias hoy</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rating-icon">⭐</div>
          <div className="stat-value">{stats.today.rating.toFixed(1)}</div>
          <div className="stat-label">Calificación promedio</div>
        </div>
      </div>
      
      {isOnline && availableOrders.length > 0 && (
        <div className="deliveries-section">
          <div className="section-header">
            <h2 className="section-title">Pedidos disponibles ({availableOrders.length})</h2>
          </div>
          
          <div className="orders-grid">
            {availableOrders.map(order => (
              <div className="order-card" key={order.id}>
                <div className="order-header">
                  <span className="order-id">Pedido #{order.id}</span>
                  <span className="order-status status-new">Nuevo</span>
                </div>
                <div className="order-body">
                  <div className="locations">
                    <div className="location-row">
                      <div className="location-icon pickup-icon">🏪</div>
                      <div className="location-details">
                        <div className="location-type">Recoger en</div>
                        <div className="location-name">{order.restaurante}</div>
                      </div>
                    </div>
                    <div className="location-row">
                      <div className="location-icon delivery-icon">📍</div>
                      <div className="location-details">
                        <div className="location-type">Entregar en</div>
                        <div className="location-address">{order.direccion}</div>
                        <div className="location-distance">
                          <span>📏</span> {order.distancia} km
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="order-details">
                    <div className="detail-row">
                      <span className="detail-label">Valor del pedido</span>
                      <span className="detail-value highlight">${order.valor.toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Ganancia estimada</span>
                      <span className="detail-value highlight">${Math.round(order.valor * 0.1).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="order-actions">
                    <button
                      className="action-button primary-button"
                      onClick={() => acceptOrder(order.id)}
                    >
                      Aceptar pedido
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeOrders.length > 0 && (
        <div className="deliveries-section">
          <div className="section-header">
            <h2 className="section-title">Pedidos activos ({activeOrders.length})</h2>
            <Link to="/repartidor/pedidos-activos" className="view-all">
              Ver todos
            </Link>
          </div>
          
          <div className="orders-grid">
            {activeOrders.map(order => (
              <div className="order-card" key={order.id}>
                <div className="order-header">
                  <span className="order-id">Pedido #{order.id}</span>
                  <span className="order-status status-picked">{order.estado}</span>
                </div>
                <div className="order-body">
                  <div className="locations">
                    <div className="location-row">
                      <div className="location-icon pickup-icon">🏪</div>
                      <div className="location-details">
                        <div className="location-type">Recoger en</div>
                        <div className="location-name">{order.restaurante}</div>
                      </div>
                    </div>
                    <div className="location-row">
                      <div className="location-icon delivery-icon">📍</div>
                      <div className="location-details">
                        <div className="location-type">Entregar en</div>
                        <div className="location-address">{order.direccion}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="customer-details">
                    <div className="customer-avatar">👤</div>
                    <div className="customer-info">
                      <div className="customer-name">{order.cliente || 'Cliente'}</div>
                      <div className="customer-phone">📱 Ver contacto</div>
                    </div>
                    <button className="contact-button">📞</button>
                  </div>
                  
                  <div className="order-actions">
                    <Link
                      to={`/repartidor/pedidos-activos/${order.id}`}
                      className="action-button secondary-button"
                    >
                      Ver detalles
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="deliveries-section">
        <div className="section-header">
          <h2 className="section-title">Entregas recientes</h2>
          <Link to="/repartidor/historial" className="view-all">
            Ver historial
          </Link>
        </div>
        
        {recentDeliveries.length > 0 ? (
          <table className="deliveries-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Fecha</th>
                <th>Restaurante</th>
                <th>Valor</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {recentDeliveries.map(delivery => (
                <tr key={delivery.id}>
                  <td className="order-id">#{delivery.id}</td>
                  <td className="order-date">{formatDate(delivery.fecha)}</td>
                  <td className="restaurant-name">
                    <div className="restaurant-logo">🍔</div>
                    {delivery.restaurante}
                  </td>
                  <td className="order-amount">${delivery.valor.toLocaleString()}</td>
                  <td>
                    <span className="order-status status-completed">{delivery.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3 className="empty-title">Sin entregas recientes</h3>
            <p className="empty-description">Aún no has realizado entregas. ¡Comienza aceptando pedidos disponibles!</p>
          </div>
        )}
      </div>
      
      <div className="reviews-section">
        <div className="section-header">
          <h2 className="section-title">Reseñas recientes</h2>
        </div>
        
        {reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map(review => (
              <div className="review-card" key={review.id}>
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">{review.cliente.charAt(0)}</div>
                    <div>
                      <div className="reviewer-name">{review.cliente}</div>
                      <div className="review-date">{formatDate(review.fecha)}</div>
                    </div>
                  </div>
                  <div className="review-rating">
                    {'★'.repeat(review.calificacion)}
                    {'☆'.repeat(5 - review.calificacion)}
                  </div>
                </div>
                <div className="review-content">
                  {review.comentario}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">⭐</div>
            <h3 className="empty-title">Sin reseñas aún</h3>
            <p className="empty-description">Aún no has recibido reseñas. Las buenas reseñas te ayudarán a mejorar tu puntuación.</p>
          </div>
        )}
      </div>
      
      <div className="tips-section">
        <div className="tips-header">
          <span className="tips-icon">💡</span>
          <span>Consejos para mejorar tus ganancias</span>
        </div>
        <div className="tips-list">
          <div className="tip-item">
            <div className="tip-number">1</div>
            <div className="tip-content">Mantente activo durante las horas pico (almuerzo y cena) para recibir más pedidos.</div>
          </div>
          <div className="tip-item">
            <div className="tip-number">2</div>
            <div className="tip-content">Comunícate de manera clara con los clientes para mejorar tus calificaciones.</div>
          </div>
          <div className="tip-item">
            <div className="tip-number">3</div>
            <div className="tip-content">Verifica siempre los pedidos antes de salir del restaurante para evitar problemas.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DeliveryDashboard;