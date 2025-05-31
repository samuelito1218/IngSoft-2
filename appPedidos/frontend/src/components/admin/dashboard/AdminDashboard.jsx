import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaStore, 
  FaUtensils, 
  FaClipboardList, 
  FaMoneyBillWave, 
  FaStar, 
  FaPlus, 
  FaChartLine,
  FaBell,
  FaShoppingCart
} from 'react-icons/fa';
import { api } from '../../../services/api';
import RestaurantCard from '../restaurant/RestaurantCard';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalProducts: 0,
    pendingOrders: 0,
    totalOrders: 0,
    totalIncome: 0,
    averageRating: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        let userRestaurants = [];
        
        try {
          console.log("Intentando obtener restaurantes desde /restaurantes/mine");
          const restaurantsResponse = await api.get("/restaurantes/mine");
          console.log("Respuesta de /restaurantes/mine:", restaurantsResponse.data);
          userRestaurants = restaurantsResponse.data || [];
        } catch (firstError) {
          console.error("Error con /restaurantes/mine:", firstError);
          
          try {
            console.log("Intentando con ruta alternativa /restaurantes/mis-restaurantes");
            const altResponse = await api.get("/restaurantes/mis-restaurantes");
            console.log("Respuesta de /restaurantes/mis-restaurantes:", altResponse.data);
            
            if (altResponse.data && altResponse.data.restaurantes) {
              userRestaurants = altResponse.data.restaurantes;
            } else {
              userRestaurants = altResponse.data || [];
            }
          } catch (secondError) {
            console.error("Error con /restaurantes/mis-restaurantes:", secondError);
            throw new Error("No se pudieron obtener los restaurantes del usuario");
          }
        }
        
        console.log("Restaurantes obtenidos:", userRestaurants);
        setRestaurants(userRestaurants);

        let totalProducts = 0;
        let pendingOrders = 0;
        let totalOrders = 0;
        let totalIncome = 0;
        let averageRating = 0;

        if (userRestaurants.length > 0) {
          setSelectedRestaurant(userRestaurants[0].id);
          
          for (const restaurant of userRestaurants) {
            try {
              const productsResponse = await api.get(`/restaurantes/${restaurant.id}/productos`);
              if (productsResponse.data) {
                totalProducts += productsResponse.data.length;
              }
            } catch (err) {
              console.error(`Error al obtener productos del restaurante ${restaurant.id}:`, err);
            }
          }
          
          try {
            const ordersResponse = await api.get(`/pedidos/restaurante/${userRestaurants[0].id}`);
            if (ordersResponse.data) {
              const orders = ordersResponse.data;
              totalOrders = orders.length;
              
              pendingOrders = orders.filter(order => order.estado === 'Pendiente').length;
              
              const completedOrders = orders.filter(order => order.estado === 'Entregado');
              totalIncome = completedOrders.reduce((sum, order) => sum + order.total, 0);

              setRecentOrders(
                orders
                  .sort((a, b) => new Date(b.fechaDeCreacion) - new Date(a.fechaDeCreacion))
                  .slice(0, 5)
              );
            }
          } catch (err) {
            console.error(`Error al obtener pedidos del restaurante ${userRestaurants[0].id}:`, err);
          }

          try {
            const calificacionesResponse = await api.get(`/calificaciones/restaurante/${userRestaurants[0].id}`);
            if (calificacionesResponse.data && calificacionesResponse.data.restaurante) {
              averageRating = calificacionesResponse.data.restaurante.calificacionPromedio || 0;
            }
          } catch (err) {
            console.error(`Error al obtener calificaciones del restaurante ${userRestaurants[0].id}:`, err);
            averageRating = 0;
          }
        }

        setStats({
          totalRestaurants: userRestaurants.length,
          totalProducts,
          pendingOrders,
          totalOrders,
          totalIncome,
          averageRating 
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('No se pudieron cargar los datos. Por favor, intente de nuevo.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const handleRestaurantChange = async (e) => {
    const restaurantId = e.target.value;
    setSelectedRestaurant(restaurantId);

    try {
      let pendingOrders = 0;
      let totalOrders = 0;
      let totalIncome = 0;
      let averageRating = 0;

      const ordersResponse = await api.get(`/pedidos/restaurante/${restaurantId}`);
      if (ordersResponse.data) {
        const orders = ordersResponse.data;
        totalOrders = orders.length;

        pendingOrders = orders.filter(order => order.estado === 'Pendiente').length;
        
        const completedOrders = orders.filter(order => order.estado === 'Entregado');
        totalIncome = completedOrders.reduce((sum, order) => sum + order.total, 0);

        setRecentOrders(
          orders
            .sort((a, b) => new Date(b.fechaDeCreacion) - new Date(a.fechaDeCreacion))
            .slice(0, 5)
        );
      }

      try {
        const calificacionesResponse = await api.get(`/calificaciones/restaurante/${restaurantId}`);
        if (calificacionesResponse.data && calificacionesResponse.data.restaurante) {
          averageRating = calificacionesResponse.data.restaurante.calificacionPromedio || 0;
        }
      } catch (err) {
        console.error(`Error al obtener calificaciones del restaurante ${restaurantId}:`, err);
        averageRating = 0;
      }

      setStats(prev => ({
        ...prev,
        pendingOrders,
        totalOrders,
        totalIncome,
        averageRating 
      }));
    } catch (err) {
      console.error(`Error al obtener datos del restaurante ${restaurantId}:`, err);
    }
  };

  const handleCreateRestaurant = () => {
    navigate('/admin/restaurantes/nuevo');
  };

  const handleManageRestaurant = (id) => {
    navigate(`/admin/restaurantes/${id}`);
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }
  
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Dashboard de Administración</h2>
        
        {restaurants.length > 0 && (
          <div className="restaurant-selector">
            <label htmlFor="restaurant-select">Restaurante:</label>
            <select 
              id="restaurant-select" 
              value={selectedRestaurant || ''} 
              onChange={handleRestaurantChange}
            >
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FaStore />
          </div>
          <div className="stat-info">
            <h3>Mis Restaurantes</h3>
            <p className="stat-value">{stats.totalRestaurants}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <FaUtensils />
          </div>
          <div className="stat-info">
            <h3>Total Productos</h3>
            <p className="stat-value">{stats.totalProducts}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">
            <FaClipboardList />
          </div>
          <div className="stat-info">
            <h3>Pedidos Pendientes</h3>
            <p className="stat-value">{stats.pendingOrders}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon completed">
            <FaClipboardList />
          </div>
          <div className="stat-info">
            <h3>Total Pedidos</h3>
            <p className="stat-value">{stats.totalOrders}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon revenue">
            <FaMoneyBillWave />
          </div>
          <div className="stat-info">
            <h3>Ingresos Totales</h3>
            <p className="stat-value">{formatCurrency(stats.totalIncome)}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon rating">
            <FaStar />
          </div>
          <div className="stat-info">
            <h3>Calificación Promedio</h3>
            <p className="stat-value">{stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'} <small>/ 5</small></p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-section">
          <div className="section-header">
            <h3>Acciones Rápidas</h3>
          </div>
          
          <div className="quick-actions">
            <div className="action-card" onClick={handleCreateRestaurant}>
              <div className="action-icon">
                <FaPlus />
              </div>
              <h3>Crear Restaurante</h3>
              <p>Añade un nuevo restaurante a tu catálogo</p>
            </div>
            
            {selectedRestaurant && (
              <>
                <div 
                  className="action-card" 
                  onClick={() => navigate(`/admin/productos/${selectedRestaurant}`)}
                >
                  <div className="action-icon">
                    <FaUtensils />
                  </div>
                  <h3>Gestionar Productos</h3>
                  <p>Administra el menú del restaurante</p>
                </div>
                
                <div 
                  className="action-card" 
                  onClick={() => navigate(`/admin/restaurantes/${selectedRestaurant}`)}
                >
                  <div className="action-icon">
                    <FaClipboardList />
                  </div>
                  <h3>Ver Pedidos</h3>
                  <p>Enterate de toda la información de tus pedidos</p>
                </div>
                
                <div 
                  className="action-card"
                  onClick={() => navigate(`/admin/estadisticas`)}
                >
                  <div className="action-icon">
                    <FaChartLine />
                  </div>
                  <h3>Ver Estadísticas</h3>
                  <p>Analiza el rendimiento del restaurante</p>
                </div>
              </>
            )}
          </div>
        </div>
        
        {restaurants.length > 0 ? (
          <div className="dashboard-columns">
            <div className="dashboard-section flex-1">
              <div className="section-header">
                <h3>Mis Restaurantes</h3>
              </div>
              
              <div className="restaurants-list">
                {restaurants.map(restaurant => (
                  <RestaurantCard 
                    key={restaurant.id}
                    restaurant={restaurant}
                    onClick={() => handleManageRestaurant(restaurant.id)}
                  />
                ))}
              </div>
            </div>
            
            {selectedRestaurant && (
              <div className="dashboard-section flex-1">
                <div className="section-header">
                  <h3>Pedidos Recientes</h3>
                  <button 
                    className="view-all-button"
                    onClick={() => navigate(`/admin/restaurantes/${selectedRestaurant}`)}
                  >
                    Ver Todos
                  </button>
                </div>
                
                <div className="recent-orders">
                  {recentOrders.length > 0 ? (
                    recentOrders.map(order => (
                      <div key={order.id} className={`recent-order-card ${order.estado.toLowerCase()}`}>
                        <div className="order-icon">
                          <FaShoppingCart />
                        </div>
                        <div className="order-details">
                          <h4>Pedido #{order.id.substring(0, 8)}</h4>
                          <p className="order-meta">
                            {formatDate(order.fechaDeCreacion)} - {formatCurrency(order.total)}
                          </p>
                          <p className="order-customer">
                            Cliente: {order.cliente?.nombreCompleto || 'Cliente'}
                          </p>
                        </div>
                        
                      </div>
                    ))
                  ) : (
                    <div className="empty-message">
                      <p>No hay pedidos recientes</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="dashboard-section">
            <div className="empty-state">
              <div className="empty-icon">
                <FaStore />
              </div>
              <h3>No tienes restaurantes</h3>
              <p>Comienza creando tu primer restaurante para administrar</p>
              <button className="create-button" onClick={handleCreateRestaurant}>
                <FaPlus /> Crear mi primer restaurante
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;