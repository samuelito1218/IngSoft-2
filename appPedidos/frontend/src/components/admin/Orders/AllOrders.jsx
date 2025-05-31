import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { 
  FaSearch, 
  FaFilter, 
  FaEye, 
  FaClipboardList, 
  FaStore, 
  FaClock, 
  FaUser, 
  FaMoneyBillWave 
} from 'react-icons/fa';
import './AllOrders.css';

const AllOrders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const restaurantsResponse = await api.get('/restaurantes/mine');
        const userRestaurants = restaurantsResponse.data || [];
        setRestaurants(userRestaurants);
        
        let allOrders = [];
        
        for (const restaurant of userRestaurants) {
          try {
            const ordersResponse = await api.get(`/pedidos/restaurante/${restaurant.id}`);
            
            if (ordersResponse.data && Array.isArray(ordersResponse.data)) {
              const ordersWithRestaurant = ordersResponse.data.map(order => ({
                ...order,
                restaurantName: restaurant.nombre,
                restaurantId: restaurant.id
              }));
              
              allOrders = [...allOrders, ...ordersWithRestaurant];
            }
          } catch (err) {
            console.error(`Error al obtener pedidos del restaurante ${restaurant.id}:`, err);
          }
        }
 
        allOrders.sort((a, b) => new Date(b.fechaDeCreacion) - new Date(a.fechaDeCreacion));
        
        setOrders(allOrders);
        setFilteredOrders(allOrders);
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('No se pudieron cargar los datos. Por favor, intente de nuevo.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...orders];

    if (searchTerm) {
      result = result.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.cliente?.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.direccionEntrega?.direccionEspecifica?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
 
    if (selectedRestaurant !== 'all') {
      result = result.filter(order => order.restaurantId === selectedRestaurant);
    }

    if (selectedStatus !== 'all') {
      result = result.filter(order => order.estado === selectedStatus);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      result = result.filter(order => new Date(order.fechaDeCreacion) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(order => new Date(order.fechaDeCreacion) <= toDate);
    }
    
    setFilteredOrders(result);
    setCurrentPage(1); 
  }, [searchTerm, selectedRestaurant, selectedStatus, dateFrom, dateTo, orders]);
  
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRestaurant('all');
    setSelectedStatus('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleViewOrder = (restaurantId, orderId) => {
    navigate(`/admin/restaurantes/${restaurantId}?pedido=${orderId}`);
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando pedidos...</p>
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
    <div className="all-orders-container">
      <div className="page-header">
        <h2>Visualización de Pedidos</h2>
        <p style={{ 
          fontSize: '14px', 
          color: '#666', 
          margin: '8px 0 0 0' 
        }}>
          Vista de solo lectura - Los pedidos son gestionados automáticamente
        </p>
        
        <div className="search-bar">
          <div className="search-input">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Buscar por ID, cliente o dirección..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            className="filter-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter /> Filtros
          </button>
        </div>
      </div>
      
      {showFilters && (
        <div className="filters-container">
          <div className="filter-row">
            <div className="filter-group">
              <label>Restaurante</label>
              <select 
                value={selectedRestaurant} 
                onChange={(e) => setSelectedRestaurant(e.target.value)}
              >
                <option value="all">Todos los restaurantes</option>
                {restaurants.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Estado</label>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Preparado">Preparado</option>
                <option value="En_Camino">En Camino</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Desde</label>
              <input 
                type="date" 
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <label>Hasta</label>
              <input 
                type="date" 
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            
            <button 
              className="clear-filters-button"
              onClick={clearFilters}
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      )}
      
      <div className="orders-stats">
        <div className="stat-box">
          <h3>Total de Pedidos</h3>
          <p>{filteredOrders.length}</p>
        </div>
        <div className="stat-box">
          <h3>Pendientes</h3>
          <p>{filteredOrders.filter(o => o.estado === 'Pendiente').length}</p>
        </div>
        <div className="stat-box">
          <h3>En Camino</h3>
          <p>{filteredOrders.filter(o => o.estado === 'En_Camino').length}</p>
        </div>
        <div className="stat-box">
          <h3>Entregados</h3>
          <p>{filteredOrders.filter(o => o.estado === 'Entregado').length}</p>
        </div>
        <div className="stat-box">
          <h3>Cancelados</h3>
          <p>{filteredOrders.filter(o => o.estado === 'Cancelado').length}</p>
        </div>
      </div>
      
      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <FaClipboardList className="empty-icon" />
          <h3>No se encontraron pedidos</h3>
          <p>No hay pedidos que coincidan con los filtros aplicados.</p>
        </div>
      ) : (
        <>
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>ID de Pedido</th>
                  <th>Restaurante</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Dirección</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Ver</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map(order => (
                  <tr key={order.id} className={order.estado.toLowerCase()}>
                    <td>#{order.id.substring(0, 8)}</td>
                    <td>
                      <div className="restaurant-cell">
                        <FaStore className="cell-icon" />
                        <span>{order.restaurantName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <FaClock className="cell-icon" />
                        <span>{formatDate(order.fechaDeCreacion)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <FaUser className="cell-icon" />
                        <span>{order.cliente?.nombreCompleto || 'Cliente'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="address-cell" title={`${order.direccionEntrega.direccionEspecifica}, ${order.direccionEntrega.barrio}, Comuna ${order.direccionEntrega.comuna}`}>
                        {order.direccionEntrega.direccionEspecifica.length > 25 
                          ? `${order.direccionEntrega.direccionEspecifica.substring(0, 25)}...` 
                          : order.direccionEntrega.direccionEspecifica}
                      </div>
                    </td>
                    <td>
                      <div className="price-cell">
                        <FaMoneyBillWave className="cell-icon" />
                        <span>{formatPrice(order.total)}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${order.estado.toLowerCase()}`}>
                        {order.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="view-button"
                        onClick={() => handleViewOrder(order.restaurantId, order.id)}
                        title="Ver detalles (solo lectura)"
                      >
                        <FaEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredOrders.length > ordersPerPage && (
            <div className="pagination">
              <button 
                className="pagination-button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                &laquo; Anterior
              </button>
              
              {Array.from({ length: Math.ceil(filteredOrders.length / ordersPerPage) }).map((_, index) => (
                <button 
                  key={index}
                  className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              
              <button 
                className="pagination-button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredOrders.length / ordersPerPage)))}
                disabled={currentPage === Math.ceil(filteredOrders.length / ordersPerPage)}
              >
                Siguiente &raquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AllOrders;