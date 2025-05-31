import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaSearch, FaListAlt, FaRegSadTear, 
  FaClock, FaMotorcycle, FaCheckCircle, FaTimesCircle, 
  FaStar, FaEye
} from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import ApiService from '../../../services/api';
import OrderService from '../../../services/OrderService';
import './OrderHistory.css';

const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [pedidos, setPedidos] = useState([]);
  const [filteredPedidos, setFilteredPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await ApiService.pedidos.historial();
        
        if (response.data && Array.isArray(response.data)) {
          const sortedPedidos = response.data.sort((a, b) => 
            new Date(b.fechaDeCreacion) - new Date(a.fechaDeCreacion)
          );
          
          setPedidos(sortedPedidos);
          setFilteredPedidos(sortedPedidos);
        } else {
          setPedidos([]);
          setFilteredPedidos([]);
        }
        
        setLoading(false);
      } catch (error) {
        setError('No se pudieron cargar tus pedidos. Intenta nuevamente.');
        setLoading(false);
      }
    };
    
    if (user) {
      fetchPedidos();
    }
  }, [user]);
  
  useEffect(() => {
    if (!pedidos.length) return;
    
    let filtered = [...pedidos];
    
    if (filterStatus !== 'Todos') {
      filtered = filtered.filter(pedido => pedido.estado === filterStatus);
    }
    
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(pedido => {
        if (pedido.id.toLowerCase().includes(term)) return true;
        
        if (pedido.direccionEntrega && (
          pedido.direccionEntrega.barrio.toLowerCase().includes(term) ||
          pedido.direccionEntrega.direccionEspecifica.toLowerCase().includes(term)
        )) return true;
        
        if (pedido.productos && Array.isArray(pedido.productos)) {
          return pedido.productos.some(producto => 
            producto.nombre && producto.nombre.toLowerCase().includes(term)
          );
        }
        
        return false;
      });
    }
    
    setFilteredPedidos(filtered);
  }, [searchTerm, filterStatus, pedidos]);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return <FaClock className="status-icon pending" />;
      case 'En_Camino':
        return <FaMotorcycle className="status-icon in-progress" />;
      case 'Entregado':
        return <FaCheckCircle className="status-icon completed" />;
      case 'Cancelado':
        return <FaTimesCircle className="status-icon cancelled" />;
      default:
        return <FaClock className="status-icon" />;
    }
  };
  
  const canRate = (pedido) => {
    return pedido.estado === 'Entregado' && !pedido.calificado;
  };
  
  const viewOrderDetails = (pedidoId) => {
    navigate(`/cliente/delivery-tracking/${pedidoId}`);
  };
  
  const rateOrder = (pedidoId, event) => {
    event.stopPropagation();
    navigate(`/cliente/calificar/${pedidoId}`);
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleStatusFilter = (estado) => {
    setFilterStatus(estado);
  };
  
  const handleBack = () => {
    navigate(-1);
  };
  
  if (loading) {
    return (
      <div className="order-history-loading">
        <div className="spinner"></div>
        <p>Cargando tus pedidos...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="order-history-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }
  
  return (
    <div className="order-history-page">
      <div className="order-history-header">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft />
        </button>
        <h1>Historial de Pedidos</h1>
      </div>
      
      <div className="search-filter-container">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar pedidos..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="filter-container">
          <button 
            className={`filter-button ${filterStatus === 'Todos' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('Todos')}
          >
            Todos
          </button>
          <button 
            className={`filter-button ${filterStatus === 'Pendiente' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('Pendiente')}
          >
            Pendiente
          </button>
          <button 
            className={`filter-button ${filterStatus === 'En_Camino' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('En_Camino')}
          >
            En Camino
          </button>
          <button 
            className={`filter-button ${filterStatus === 'Entregado' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('Entregado')}
          >
            Entregado
          </button>
          <button 
            className={`filter-button ${filterStatus === 'Cancelado' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('Cancelado')}
          >
            Cancelado
          </button>
        </div>
      </div>
      
      {filteredPedidos.length === 0 ? (
        <div className="no-orders">
          <div className="no-orders-icon">
            <FaRegSadTear />
          </div>
          <h2>No se encontraron pedidos</h2>
          
          {pedidos.length === 0 ? (
            <p>Aún no has realizado ningún pedido. ¡Haz tu primer pedido ahora!</p>
          ) : (
            <p>No hay pedidos que coincidan con tu búsqueda. Intenta con otros criterios.</p>
          )}
          
          {pedidos.length === 0 && (
            <button 
              className="explore-button"
              onClick={() => navigate('/cliente')}
            >
              Explorar restaurantes
            </button>
          )}
        </div>
      ) : (
        <div className="orders-list">
          {filteredPedidos.map(pedido => (
            <div 
              key={pedido.id} 
              className="order-card"
              onClick={() => viewOrderDetails(pedido.id)}
            >
              <div className="order-card-header">
                <div className="order-id-date">
                  <span className="order-id">Pedido #{pedido.id.slice(-6)}</span>
                  <span className="order-date">{formatDate(pedido.fechaDeCreacion)}</span>
                </div>
                
                <div className="order-status">
                  {getStatusIcon(pedido.estado)}
                  <span>{pedido.estado.replace('_', ' ')}</span>
                </div>
              </div>
              
              <div className="order-card-content">
                <div className="order-details">
                  <div className="detail-row">
                    <span className="detail-label">Dirección:</span>
                    <span className="detail-value">
                      {pedido.direccionEntrega.direccionEspecifica}, {pedido.direccionEntrega.barrio}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Productos:</span>
                    <span className="detail-value">
                      {pedido.productos && pedido.productos.length
                        ? `${pedido.productos.length} productos`
                        : 'No disponible'}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Total:</span>
                    <span className="detail-value total">{formatPrice(pedido.total)}</span>
                  </div>
                </div>
                
                <div className="order-actions">
                  <button 
                    className="view-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      viewOrderDetails(pedido.id);
                    }}
                  >
                    <FaEye /> Ver detalles
                  </button>
                  
                  {canRate(pedido) && (
                    <button 
                      className="rate-button" 
                      onClick={(e) => rateOrder(pedido.id, e)}
                    >
                      <FaStar /> Calificar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {filteredPedidos.length > 0 && pedidos.length > 10 && (
        <div className="load-more-container">
          <button className="load-more-button">
            Cargar más pedidos
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;