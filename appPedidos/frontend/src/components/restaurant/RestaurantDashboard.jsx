import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import '../../styles/RestaurantDashboard.css';

function RestaurantDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    today: {
      orders: 0,
      revenue: 0,
      avgOrderValue: 0,
      cancelRate: 0
    },
    week: {
      orders: 0,
      revenue: 0,
      avgOrderValue: 0,
      cancelRate: 0
    },
    month: {
      orders: 0,
      revenue: 0,
      avgOrderValue: 0,
      cancelRate: 0
    }
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // En una implementación real, estas serían llamadas a la API
        // const statsResponse = await api.get('/restaurante/stats');
        // const ordersResponse = await api.get('/restaurante/pedidos-recientes');
        // const itemsResponse = await api.get('/restaurante/productos-populares');
        // const reviewsResponse = await api.get('/restaurante/reviews-recientes');
        
        // Datos de muestra para probar la interfaz
        const mockStats = {
          today: {
            orders: 12,
            revenue: 215000,
            avgOrderValue: 17917,
            cancelRate: 8.3
          },
          week: {
            orders: 83,
            revenue: 1450000,
            avgOrderValue: 17470,
            cancelRate: 7.2
          },
          month: {
            orders: 342,
            revenue: 5980000,
            avgOrderValue: 17485,
            cancelRate: 6.7
          }
        };
        
        const mockRecentOrders = [
          {
            id: '1',
            time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            customer: 'Juan Pérez',
            items: 3,
            total: 32000,
            status: 'Pendiente'
          },
          {
            id: '2',
            time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            customer: 'María Rodríguez',
            items: 2,
            total: 25000,
            status: 'Preparando'
          },
          {
            id: '3',
            time: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
            customer: 'Carlos Santos',
            items: 4,
            total: 42000,
            status: 'Completado'
          },
          {
            id: '4',
            time: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
            customer: 'Diana Martínez',
            items: 2,
            total: 28000,
            status: 'Completado'
          }
        ];
        
        const mockPopularItems = [
          {
            id: '1',
            name: 'Hamburguesa Especial',
            category: 'Hamburguesas',
            sales: 48,
            image: 'https://via.placeholder.com/50?text=Hamburguesa'
          },
          {
            id: '2',
            name: 'Papas Fritas Grande',
            category: 'Acompañamientos',
            sales: 42,
            image: 'https://via.placeholder.com/50?text=Papas'
          },
          {
            id: '3',
            name: 'Pizza Familiar',
            category: 'Pizzas',
            sales: 35,
            image: 'https://via.placeholder.com/50?text=Pizza'
          }
        ];
        
        const mockRecentReviews = [
          {
            id: '1',
            customer: 'Juan Pérez',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            rating: 5,
            comment: 'Excelente comida y servicio rápido. ¡Definitivamente volveré!'
          },
          {
            id: '2',
            customer: 'María Rodríguez',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            rating: 4,
            comment: 'Muy buena comida, pero el tiempo de entrega fue un poco más largo de lo esperado.'
          },
          {
            id: '3',
            customer: 'Carlos Santos',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            rating: 5,
            comment: 'Las mejores hamburguesas de la ciudad. El repartidor fue muy amable.'
          }
        ];
        
        setStats(mockStats);
        setRecentOrders(mockRecentOrders);
        setPopularItems(mockPopularItems);
        setRecentReviews(mockRecentReviews);
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
  
  const formatDate = (dateString) => {
    const options = { 
      hour: '2-digit', 
      minute: '2-digit',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('es-CO', options);
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'Pendiente':
        return 'status-pending';
      case 'Preparando':
        return 'status-preparing';
      case 'Listo':
        return 'status-ready';
      case 'Completado':
        return 'status-completed';
      default:
        return '';
    }
  };
  
  if (loading) {
    return <div className="loading-container">Cargando dashboard...</div>;
  }
  
  if (error) {
    return <div className="error-container">{error}</div>;
  }
  
  return (
    <div className="restaurant-dashboard">
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-icon">📊</span> 
              Resumen de Ventas
            </h2>
            <div className="card-actions">
              <button className="card-button">⋮</button>
            </div>
          </div>
          
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-value">{stats.today.orders}</div>
              <div className="stat-label">Pedidos hoy</div>
              <div className="trend-indicator trend-up">
                <span>↑</span> 12% vs. ayer
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">${stats.today.revenue.toLocaleString()}</div>
              <div className="stat-label">Ventas hoy</div>
              <div className="trend-indicator trend-up">
                <span>↑</span> 8% vs. ayer
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">${stats.today.avgOrderValue.toLocaleString()}</div>
              <div className="stat-label">Valor promedio</div>
              <div className="trend-indicator trend-down">
                <span>↓</span> 2% vs. ayer
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{stats.today.cancelRate}%</div>
              <div className="stat-label">Tasa de cancelación</div>
              <div className="trend-indicator trend-up">
                <span>↑</span> 1% vs. ayer
              </div>
            </div>
          </div>
          
          <div className="chart-container">
            {/* Aquí iría un gráfico real - representación simplificada */}
            <div style={{ 
              backgroundColor: '#f5f5f5', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '8px',
              color: '#666'
            }}>
              Gráfico de ventas diarias
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-icon">📦</span> 
              Pedidos Recientes
            </h2>
            <div className="card-actions">
              <Link to="/restaurante/pedidos" className="view-all-link">Ver todos</Link>
            </div>
          </div>
          
          <div className="orders-list">
            {recentOrders.map(order => (
              <div className="order-card" key={order.id}>
                <div className="order-info">
                  <div className="order-number">Pedido #{order.id}</div>
                  <div className="order-details">
                    <span>{formatDate(order.time)}</span>
                    <span>•</span>
                    <span>{order.items} productos</span>
                  </div>
                </div>
                <div className="order-status-actions">
                  <span className={`order-status ${getStatusClass(order.status)}`}>{order.status}</span>
                  <div className="order-actions">
                    <Link to={`/restaurante/pedidos/${order.id}`} className="action-button">👁️</Link>
                    <button className="action-button">📋</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-icon">🔥</span> 
              Productos Populares
            </h2>
            <div className="card-actions">
              <Link to="/restaurante/menu" className="view-all-link">Ver todos</Link>
            </div>
          </div>
          
          <div className="popular-items">
            {popularItems.map(item => (
              <div className="item-card" key={item.id}>
                <img src={item.image} alt={item.name} className="item-image" />
                <div className="item-details">
                  <div className="item-name">{item.name}</div>
                  <div className="item-category">{item.category}</div>
                  <div className="item-sales">{item.sales} vendidos este mes</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-icon">⭐</span> 
              Reseñas Recientes
            </h2>
            <div className="card-actions">
              <button className="card-button">⋮</button>
            </div>
          </div>
          
          <div className="reviews-list">
            {recentReviews.map(review => (
              <div className="review-card" key={review.id}>
                <div className="review-header">
                  <div className="reviewer-info">
                    <div className="reviewer-avatar">{review.customer.charAt(0)}</div>
                    <div className="reviewer-name">{review.customer}</div>
                  </div>
                  <div className="review-date">{formatDate(review.date)}</div>
                </div>
                <div className="review-rating">
                  {'★'.repeat(review.rating)}
                  {'☆'.repeat(5 - review.rating)}
                </div>
                <div className="review-content">
                  {review.comment}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RestaurantDashboard;