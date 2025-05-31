import React, { useState, useEffect } from 'react';
import { FaHistory, FaStore, FaUser, FaCalendarAlt, FaComments, FaStar, FaTrophy, FaMoneyBillWave, FaSearch, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import pedidoCache from '../../utils/PedidoLinkedListCache';
import '../../styles/HistorialPedidos.css';

const HistorialPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    totalEntregas: 0,
    valorTotal: 0,
    valorPromedio: 0,
    pedidosAltaCalidad: 0,
    calificacionPromedio: 0
  });
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: 'todos',
    fechaDesde: '',
    fechaHasta: '',
    montoMinimo: ''
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchHistorial();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [pedidos, filtros]);

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      const response = await ApiService.pedidos.repartidorHistorial();
      
      if (response.data) {
        // Guardar pedidos en cache para búsquedas rápidas
        response.data.forEach(pedido => {
          pedidoCache.put(pedido);
        });
        
        setPedidos(response.data);
        calcularEstadisticas(response.data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setError('No se pudo cargar el historial de pedidos. Intente nuevamente.');
      setLoading(false);
    }
  };

  const calcularEstadisticas = (pedidosData) => {
    if (!pedidosData || pedidosData.length === 0) {
      setEstadisticas({
        totalEntregas: 0,
        valorTotal: 0,
        valorPromedio: 0,
        pedidosAltaCalidad: 0,
        calificacionPromedio: 0
      });
      return;
    }

    const totalEntregas = pedidosData.length;
    const valorTotal = pedidosData.reduce((sum, pedido) => sum + (pedido.total || 0), 0);
    const valorPromedio = valorTotal / totalEntregas;
    const pedidosAltaCalidad = pedidosData.filter(pedido => (pedido.total || 0) >= 50).length;

    // Calcular calificación promedio
    let totalCalificaciones = 0;
    let cantidadCalificaciones = 0;

    pedidosData.forEach(pedido => {
      if (pedido.calificaciones && Array.isArray(pedido.calificaciones)) {
        pedido.calificaciones.forEach(calificacion => {
          if (calificacion.calificacionRepartidor && calificacion.calificacionRepartidor > 0) {
            totalCalificaciones += calificacion.calificacionRepartidor;
            cantidadCalificaciones++;
          }
        });
      }
    });

    const calificacionPromedio = cantidadCalificaciones > 0 
      ? (totalCalificaciones / cantidadCalificaciones) 
      : 0;

    setEstadisticas({
      totalEntregas,
      valorTotal,
      valorPromedio,
      pedidosAltaCalidad,
      calificacionPromedio
    });
  };

  const aplicarFiltros = () => {
    if (!pedidos.length) {
      setPedidosFiltrados([]);
      return;
    }

    let pedidosParaFiltrar = pedidos;
    
    if (filtros.busqueda.trim()) {
      const resultadosCache = pedidoCache.search({
        restaurante: filtros.busqueda,
        cliente: filtros.busqueda
      });
      
      if (resultadosCache.length > 0) {
        pedidosParaFiltrar = resultadosCache;
      } else {
        pedidosParaFiltrar = pedidos.filter(pedido => 
          pedido.restaurante?.nombre?.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
          pedido.cliente?.nombreCompleto?.toLowerCase().includes(filtros.busqueda.toLowerCase())
        );
      }
    }

    let resultado = pedidosParaFiltrar.filter(pedido => {
      if (filtros.estado !== 'todos' && pedido.estado !== filtros.estado) {
        return false;
      }

      if (filtros.fechaDesde) {
        const fechaPedido = new Date(pedido.fechaDeCreacion);
        const fechaDesde = new Date(filtros.fechaDesde);
        if (fechaPedido < fechaDesde) return false;
      }

      if (filtros.fechaHasta) {
        const fechaPedido = new Date(pedido.fechaDeCreacion);
        const fechaHasta = new Date(filtros.fechaHasta);
        if (fechaPedido > fechaHasta) return false;
      }

      if (filtros.montoMinimo && (pedido.total || 0) < parseFloat(filtros.montoMinimo)) {
        return false;
      }

      return true;
    });

    resultado.sort((a, b) => new Date(b.fechaDeCreacion) - new Date(a.fechaDeCreacion));

    setPedidosFiltrados(resultado);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      estado: 'todos',
      fechaDesde: '',
      fechaHasta: '',
      montoMinimo: ''
    });
  };

  const getPriorityColor = (precio) => {
    if (precio >= 50) return '#27ae60';
    if (precio >= 25) return '#f39c12';
    return '#3498db';
  };

  const getPriorityLabel = (precio) => {
    if (precio >= 50) return 'Alta';
    if (precio >= 25) return 'Media';
    return 'Normal';
  };

  if (loading) {
    return (
      <div className="historial-loading">
        <div className="spinner"></div>
        <p>Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="historial-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="historial-container">
      <div className="historial-header">
        <h1>Historial de Entregas</h1>
        <p>Resumen de tus entregas completadas</p>
      </div>

      {/* Estadísticas */}
      {pedidos.length > 0 && (
        <div className="estadisticas-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FaHistory />
            </div>
            <div className="stat-info">
              <h3>{estadisticas.totalEntregas}</h3>
              <p>Total entregas</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon money">
              <FaMoneyBillWave />
            </div>
            <div className="stat-info">
              <h3>${estadisticas.valorTotal.toFixed(2)}</h3>
              <p>Valor total</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon average">
              <FaTrophy />
            </div>
            <div className="stat-info">
              <h3>${estadisticas.valorPromedio.toFixed(2)}</h3>
              <p>Promedio por entrega</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon priority">
              <FaStar />
            </div>
            <div className="stat-info">
              <h3>{estadisticas.pedidosAltaCalidad}</h3>
              <p>Entregas premium</p>
              <small>(≥ $50000)</small>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon rating">
              <FaStar />
            </div>
            <div className="stat-info">
              <h3>{estadisticas.calificacionPromedio.toFixed(1)}</h3>
              <p>Calificación promedio</p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-header">
          <div className="busqueda-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por restaurante o cliente..."
              value={filtros.busqueda}
              onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
              className="busqueda-input"
            />
          </div>
          
          <button 
            className="filtros-toggle"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <FaFilter />
            Filtros
          </button>
        </div>

        {mostrarFiltros && (
          <div className="filtros-avanzados">
            <div className="filtro-group">
              <label>Estado:</label>
              <select
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div className="filtro-group">
              <label>Desde:</label>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              />
            </div>

            <div className="filtro-group">
              <label>Hasta:</label>
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              />
            </div>

            <div className="filtro-group">
              <label>Monto mínimo:</label>
              <input
                type="number"
                placeholder="0.00"
                value={filtros.montoMinimo}
                onChange={(e) => handleFiltroChange('montoMinimo', e.target.value)}
              />
            </div>

            <button className="limpiar-filtros" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Resultados */}
      <div className="resultados-info">
        <p>Mostrando {pedidosFiltrados.length} de {pedidos.length} entregas</p>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className="empty-historial">
          <FaHistory className="empty-icon" />
          <h3>
            {pedidos.length === 0 
              ? 'No tienes entregas completadas' 
              : 'No se encontraron entregas con los filtros aplicados'
            }
          </h3>
          <p>
            {pedidos.length === 0 
              ? 'Tu historial de entregas aparecerá aquí' 
              : 'Intenta cambiar los filtros de búsqueda'
            }
          </p>
        </div>
      ) : (
        <div className="historial-grid">
          {pedidosFiltrados.map((pedido) => (
            <div key={pedido.id} className="historial-card">
              <div className="historial-card-header">
                <div className="restaurante-info">
                  <FaStore className="icon" />
                  <h3>{pedido.restaurante?.nombre || 'Restaurante'}</h3>
                </div>
                <div className="card-badges">
                  <div className="estado-badge completed">
                    {pedido.estado === 'Entregado' ? 'Entregado' : 'Cancelado'}
                  </div>
                  {(pedido.total || 0) >= 50000 && (
                    <div className="priority-badge premium">
                      <FaStar /> Premium
                    </div>
                  )}
                </div>
              </div>
              
              <div className="historial-card-body">
                <div className="info-row">
                  <FaUser className="icon" />
                  <div>
                    <span className="label">Cliente:</span>
                    <p>{pedido.cliente?.nombreCompleto || 'Cliente'}</p>
                  </div>
                </div>
                
                <div className="info-row">
                  <FaCalendarAlt className="icon" />
                  <div>
                    <span className="label">Fecha:</span>
                    <p>{new Date(pedido.fechaDeCreacion).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="total-row">
                  <span className="total-label">Total:</span>
                  <span 
                    className="total-amount"
                    style={{ color: getPriorityColor(pedido.total || 0) }}
                  >
                    ${pedido.total?.toFixed(2) || '0.00'}
                  </span>
                </div>

                <div className="priority-row">
                  <span className="priority-label">Prioridad:</span>
                  <span 
                    className="priority-value"
                    style={{ color: getPriorityColor(pedido.total || 0) }}
                  >
                    {getPriorityLabel(pedido.total || 0)}
                  </span>
                </div>

                {/* Mostrar calificación si existe */}
                {pedido.calificaciones && pedido.calificaciones.length > 0 && (
                  <div className="calificacion-row">
                    <FaStar className="star-icon" />
                    <span>
                      {pedido.calificaciones[0].calificacionRepartidor || 'Sin calificar'}
                      {pedido.calificaciones[0].calificacionRepartidor && '/5'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistorialPedidos;