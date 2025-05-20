//
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { 
  FaChartLine, 
  FaChartBar, 
  FaChartPie, 
  FaStore, 
  FaCalendarAlt,
  FaMoneyBillWave,
  FaStar
} from 'react-icons/fa';
import './Statistics.css';

const Statistics = () => {
  const navigate = useNavigate();
  
  // Estados
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Cargar restaurantes
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.get('/restaurantes/mine');
        if (response.data && response.data.length > 0) {
          setRestaurants(response.data);
          setSelectedRestaurant(response.data[0].id);
        } else {
          setError('No tienes restaurantes registrados');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error al cargar restaurantes:', err);
        setError('No se pudieron cargar los restaurantes');
        setLoading(false);
      }
    };
    
    fetchRestaurants();
  }, []);
  
  // Cargar estadísticas cuando cambia el restaurante o periodo
  useEffect(() => {
    if (!selectedRestaurant) return;
    
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        const response = await api.get(`/pedidos/restaurante/${selectedRestaurant}/estadisticas?periodo=${selectedPeriod}`);
        
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
        setError('No se pudieron cargar las estadísticas');
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [selectedRestaurant, selectedPeriod]);
  
  // Cambiar restaurante
  const handleRestaurantChange = (e) => {
    setSelectedRestaurant(e.target.value);
  };
  
  // Cambiar periodo
  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
  };
  
  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Ir a la página de gestión del restaurante
  const handleViewRestaurant = () => {
    navigate(`/admin/restaurantes/${selectedRestaurant}`);
  };
  
  if (!restaurants.length) {
    return (
      <div className="statistics-container">
        <div className="empty-state">
          <FaStore className="empty-icon" />
          <h3>No tienes restaurantes</h3>
          <p>Para ver estadísticas, primero debes crear al menos un restaurante.</p>
          <button className="create-button" onClick={() => navigate('/admin/restaurantes/nuevo')}>
            Crear Restaurante
          </button>
        </div>
      </div>
    );
  }
  
  if (loading && !stats) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando estadísticas...</p>
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
    <div className="statistics-container">
      <div className="page-header">
        <h2>Estadísticas</h2>
        
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="restaurant-select">Restaurante:</label>
            <select 
              id="restaurant-select" 
              value={selectedRestaurant} 
              onChange={handleRestaurantChange}
            >
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="period-select">Periodo:</label>
            <select 
              id="period-select" 
              value={selectedPeriod} 
              onChange={handlePeriodChange}
            >
              <option value="hoy">Hoy</option>
              <option value="semana">Última semana</option>
              <option value="mes">Último mes</option>
              <option value="año">Último año</option>
            </select>
          </div>
          
          <button 
            className="view-restaurant-button"
            onClick={handleViewRestaurant}
          >
            Ver Restaurante
          </button>
        </div>
      </div>
      
      {stats && (
        <div className="stats-content">
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-icon">
                <FaChartBar />
              </div>
              <div className="stat-content">
                <h3>Total de Pedidos</h3>
                <p className="stat-value">{stats.totalPedidos}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon money">
                <FaMoneyBillWave />
              </div>
              <div className="stat-content">
                <h3>Ingresos Totales</h3>
                <p className="stat-value">{formatCurrency(stats.totalIngresos)}</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon rating">
                <FaStar />
              </div>
              <div className="stat-content">
                <h3>Calificación Promedio</h3>
                <p className="stat-value">{stats.promedioCalificacion.toFixed(1)} <small>/ 5</small></p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon calendar">
                <FaCalendarAlt />
              </div>
              <div className="stat-content">
                <h3>Periodo</h3>
                <p className="stat-value period-value">
                  {selectedPeriod === 'hoy' && 'Hoy'}
                  {selectedPeriod === 'semana' && 'Última semana'}
                  {selectedPeriod === 'mes' && 'Último mes'}
                  {selectedPeriod === 'año' && 'Último año'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="stats-details">
            <div className="stats-section">
              <h3>Estado de Pedidos</h3>
              <div className="orders-status">
                <div className="status-item">
                  <div className="status-label">Pendientes</div>
                  <div className="status-bar">
                    <div 
                      className="status-fill pending" 
                      style={{ width: `${stats.totalPedidos ? (stats.pedidosPendientes / stats.totalPedidos) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="status-value">{stats.pedidosPendientes}</div>
                </div>
                
                <div className="status-item">
                  <div className="status-label">En Preparación</div>
                  <div className="status-bar">
                    <div 
                      className="status-fill preparing" 
                      style={{ width: `${stats.totalPedidos ? (stats.pedidosEnPreparacion / stats.totalPedidos) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="status-value">{stats.pedidosEnPreparacion}</div>
                </div>
                
                <div className="status-item">
                  <div className="status-label">En Camino</div>
                  <div className="status-bar">
                    <div 
                      className="status-fill delivery" 
                      style={{ width: `${stats.totalPedidos ? (stats.pedidosEnCamino / stats.totalPedidos) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="status-value">{stats.pedidosEnCamino}</div>
                </div>
                
                <div className="status-item">
                  <div className="status-label">Entregados</div>
                  <div className="status-bar">
                    <div 
                      className="status-fill completed" 
                      style={{ width: `${stats.totalPedidos ? (stats.pedidosEntregados / stats.totalPedidos) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="status-value">{stats.pedidosEntregados}</div>
                </div>
                
                <div className="status-item">
                  <div className="status-label">Cancelados</div>
                  <div className="status-bar">
                    <div 
                      className="status-fill cancelled" 
                      style={{ width: `${stats.totalPedidos ? (stats.pedidosCancelados / stats.totalPedidos) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="status-value">{stats.pedidosCancelados}</div>
                </div>
              </div>
            </div>
            
            <div className="stats-section">
              <h3>Productos Más Vendidos</h3>
              <div className="top-products">
                {stats.topProductos && stats.topProductos.length > 0 ? (
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Ingresos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topProductos.map(producto => (
                        <tr key={producto.id}>
                          <td>{producto.nombre}</td>
                          <td>{producto.cantidad}</td>
                          <td>{formatCurrency(producto.ingresos)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="no-data">
                    <p>No hay datos de productos vendidos en este periodo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;