// src/components/restaurant/RestaurantDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUtensils, FaClipboardList, FaBell, FaStore, FaList, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import RestaurantService from '../../../services/RestaurantService';
import OrderService from '../../../services/OrderService';
import './RestaurantDashboard.css';

const RestaurantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0
  });

  // Cargar restaurantes del usuario
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true);
        const response = await RestaurantService.getMyRestaurants();
        
        if (response.success && response.data.length > 0) {
          setRestaurants(response.data);
          setSelectedRestaurant(response.data[0]);
        } else {
          setError('No tienes restaurantes registrados.');
        }
      } catch (err) {
        console.error('Error al cargar restaurantes:', err);
        setError('No se pudieron cargar tus restaurantes. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadRestaurants();
  }, [user?.id]);

  // Cargar pedidos pendientes cuando se selecciona un restaurante
  useEffect(() => {
    if (selectedRestaurant) {
      loadPendingOrders();
      loadRestaurantStats();
    }
  }, [selectedRestaurant]);

  const loadPendingOrders = async () => {
    try {
      const response = await OrderService.getPendingOrdersByRestaurant(selectedRestaurant.id);
      
      if (response.success) {
        setPendingOrders(response.data);
      }
    } catch (err) {
      console.error('Error al cargar pedidos pendientes:', err);
    }
  };

  const loadRestaurantStats = async () => {
    try {
      const response = await OrderService.getOrderStats(selectedRestaurant.id);
      
      if (response.success) {
        setStats({
          totalOrders: response.data.totalOrders || 0,
          pendingOrders: response.data.pendingOrders || 0,
          completedOrders: response.data.completedOrders || 0,
          totalRevenue: response.data.totalRevenue || 0
        });
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  const handleRestaurantChange = (restaurantId) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    setSelectedRestaurant(restaurant);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Redirigir a las diferentes secciones
  const navigateTo = (path) => {
    if (selectedRestaurant) {
      navigate(path);
    } else {
      setError('Por favor selecciona un restaurante primero.');
    }
  };

  // Manejar acción de aceptar o rechazar pedido
  const handleOrderAction = async (orderId, action) => {
    try {
      let response;
      
      if (action === 'accept') {
        response = await OrderService.acceptOrder(orderId);
      } else {
        response = await OrderService.rejectOrder(orderId);
      }
      
      if (response.success) {
        // Actualizar la lista de pedidos pendientes
        loadPendingOrders();
        // También actualizamos las estadísticas
        loadRestaurantStats();
      } else {
        setError(response.message || `Error al ${action === 'accept' ? 'aceptar' : 'rechazar'} el pedido`);
      }
    } catch (err) {
      console.error(`Error al ${action === 'accept' ? 'aceptar' : 'rechazar'} pedido:`, err);
      setError(`Error al ${action === 'accept' ? 'aceptar' : 'rechazar'} el pedido. Intenta de nuevo.`);
    }
  };

  if (loading) {
    return (
      <div className="restaurant-dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando información de restaurantes...</p>
      </div>
    );
  }

  return (
    <div className="restaurant-dashboard">
      <div className="dashboard-header">
        <h2>Dashboard de Restaurante</h2>
        
        {restaurants.length > 0 && (
          <div className="restaurant-selector">
            <label htmlFor="restaurant-select">Seleccionar restaurante:</label>
            <select 
              id="restaurant-select"
              value={selectedRestaurant?.id || ''}
              onChange={(e) => handleRestaurantChange(e.target.value)}
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
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}
      
      {restaurants.length === 0 && !loading && (
        <div className="no-restaurants">
          <p>No tienes restaurantes registrados.</p>
          <button 
            className="primary-button"
            onClick={() => navigate('/restaurante/crear')}
          >
            Crear Restaurante
          </button>
        </div>
      )}
      
      {selectedRestaurant && (
        <>
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <FaClipboardList />
              </div>
              <div className="stat-info">
                <h3>Pedidos Totales</h3>
                <p className="stat-value">{stats.totalOrders}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon pending">
                <FaBell />
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
                <h3>Pedidos Completados</h3>
                <p className="stat-value">{stats.completedOrders}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon revenue">
                <FaChartLine />
              </div>
              <div className="stat-info">
                <h3>Ingresos Totales</h3>
                <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
          
          <div className="dashboard-actions">
            <div 
              className="action-card" 
              onClick={() => navigateTo(`/restaurante/menu/${selectedRestaurant.id}`)}
            >
              <div className="action-icon">
                <FaUtensils />
              </div>
              <h3>Administrar Menú</h3>
              <p>Agregar, editar o eliminar productos</p>
            </div>
            
            <div 
              className="action-card"
              onClick={() => navigateTo(`/restaurante/pedidos/${selectedRestaurant.id}`)}
            >
              <div className="action-icon">
                <FaClipboardList />
              </div>
              <h3>Gestionar Pedidos</h3>
              <p>Ver y administrar todos los pedidos</p>
            </div>
            
            <div 
              className="action-card"
              onClick={() => navigateTo(`/restaurante/editar/${selectedRestaurant.id}`)}
            >
              <div className="action-icon">
                <FaStore />
              </div>
              <h3>Editar Restaurante</h3>
              <p>Modificar información y ubicaciones</p>
            </div>
          </div>
          
          <div className="pending-orders-section">
            <h3>Pedidos Pendientes</h3>
            
            {pendingOrders.length === 0 ? (
              <div className="no-pending-orders">
                <p>No hay pedidos pendientes en este momento.</p>
              </div>
            ) : (
              <div className="orders-list">
                {pendingOrders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <h4>Pedido #{order.id.substring(0, 8)}</h4>
                      <span className="order-time">
                        {new Date(order.fechaDeCreacion).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="order-items">
                      {order.productos.map((item, index) => (
                        <div key={index} className="order-item">
                          <span className="item-quantity">{item.cantidad}x</span>
                          <span className="item-name">{item.nombre || 'Producto'}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="order-total">
                      <span>Total:</span>
                      <span className="total-amount">{formatCurrency(order.total)}</span>
                    </div>
                    
                    <div className="order-actions">
                      <button 
                        className="accept-button"
                        onClick={() => handleOrderAction(order.id, 'accept')}
                      >
                        Aceptar
                      </button>
                      
                      <button 
                        className="reject-button"
                        onClick={() => handleOrderAction(order.id, 'reject')}
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="view-all-orders">
              <button onClick={() => navigateTo(`/restaurante/pedidos/${selectedRestaurant.id}`)}>
                Ver todos los pedidos
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RestaurantDashboard;