import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaPlusCircle, FaClipboardList, FaChartLine } from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../services/api';
import RestaurantCard from '../restaurant/RestaurantCard';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    totalProducts: 0,
    pendingOrders: 0,
    totalOrders: 0
  });

  // Load restaurants owned by the user
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.get('/restaurantes/mine');
        
        if (response.data) {
          setRestaurants(response.data);
          setStats(prev => ({
            ...prev,
            totalRestaurants: response.data.length
          }));
          
          // Calculate total products
          let productCount = 0;
          for (const restaurant of response.data) {
            try {
              const productsResponse = await api.get(`/restaurantes/${restaurant.id}/productos`);
              if (productsResponse.data && Array.isArray(productsResponse.data)) {
                productCount += productsResponse.data.length;
              }
            } catch (err) {
              console.error(`Error fetching products for restaurant ${restaurant.id}:`, err);
            }
          }
          
          setStats(prev => ({
            ...prev,
            totalProducts: productCount
          }));
          
          // Count orders (can be expanded with order status counts)
          let pendingOrders = 0;
          let totalOrders = 0;
          
          for (const restaurant of response.data) {
            try {
              // Pending orders
              const pendingResponse = await api.get(`/pedidos/restaurante/${restaurant.id}/pendientes`);
              if (pendingResponse.data && Array.isArray(pendingResponse.data)) {
                pendingOrders += pendingResponse.data.length;
              }
              
              // All orders
              const allOrdersResponse = await api.get(`/pedidos/restaurante/${restaurant.id}`);
              if (allOrdersResponse.data && Array.isArray(allOrdersResponse.data)) {
                totalOrders += allOrdersResponse.data.length;
              }
            } catch (err) {
              console.error(`Error fetching orders for restaurant ${restaurant.id}:`, err);
            }
          }
          
          setStats(prev => ({
            ...prev,
            pendingOrders,
            totalOrders
          }));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        setError('No se pudieron cargar tus restaurantes. Por favor, intenta de nuevo.');
        setLoading(false);
      }
    };
    
    fetchRestaurants();
  }, []);

  const handleCreateRestaurant = () => {
    navigate('/admin/restaurantes/nuevo');
  };
  
  const handleViewRestaurant = (id) => {
    navigate(`/admin/restaurantes/${id}`);
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Panel de Administración</h2>
        <p className="welcome-message">
          ¡Bienvenido, {user?.nombreCompleto || 'Administrador'}!
        </p>
      </div>
      
      <div className="stats-container">
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
            <FaClipboardList />
          </div>
          <div className="stat-info">
            <h3>Total de Productos</h3>
            <p className="stat-value">{stats.totalProducts}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon primary">
            <FaClipboardList />
          </div>
          <div className="stat-info">
            <h3>Pedidos Pendientes</h3>
            <p className="stat-value">{stats.pendingOrders}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon secondary">
            <FaChartLine />
          </div>
          <div className="stat-info">
            <h3>Total de Pedidos</h3>
            <p className="stat-value">{stats.totalOrders}</p>
          </div>
        </div>
      </div>
      
      <div className="section-header">
        <h2>Mis Restaurantes</h2>
        <button className="create-button" onClick={handleCreateRestaurant}>
          <FaPlusCircle /> Crear Restaurante
        </button>
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando tus restaurantes...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FaStore />
          </div>
          <h3>No tienes restaurantes</h3>
          <p>Comienza creando tu primer restaurante para administrar.</p>
          <button className="create-button" onClick={handleCreateRestaurant}>
            <FaPlusCircle /> Crear mi primer restaurante
          </button>
        </div>
      ) : (
        <div className="restaurants-grid">
          {restaurants.map(restaurant => (
            <RestaurantCard 
              key={restaurant.id}
              restaurant={restaurant}
              onClick={() => handleViewRestaurant(restaurant.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;