import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import PedidosDisponiblesPreview from "../PedidosDisponiblesPreview";
import PedidosActivosPreview from "../PedidosActivosPreview";
import ApiService from '../../../services/api';
import '../../../styles/RepartidorDashboard.css';
import '../../../styles/ChatPedido.css';
import { FaMotorcycle, FaMapMarkerAlt, FaStar, FaCalendarAlt } from 'react-icons/fa';

const RepartidorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalEntregas: 0,
    pedidosActivos: 0,
    calificacionPromedio: 0,
    pedidosDisponibles: 0
  });
  
  useEffect(() => {
    const fetchRepartidorStats = async () => {
        try {
          setLoading(true);
          setError(null);
          
          let disponiblesResponse, disponiblesData;
          try {
            disponiblesResponse = await fetch('http://localhost:5000/api/pedidos/disponibles', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            disponiblesData = await disponiblesResponse.json();
          } catch (error) {
            disponiblesData = { data: [] };
          }
          
          let activosResponse, activosData;
          try {
            activosResponse = await fetch('http://localhost:5000/api/pedidos/repartidor/activos', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            activosData = await activosResponse.json();
          } catch (error) {
            activosData = { data: [] };
          }
          
          let historialResponse, historialData;
          try {
            historialResponse = await fetch('http://localhost:5000/api/pedidos/repartidor/historial', {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            historialData = await historialResponse.json();
          } catch (error) {
            historialData = { data: [] };
          }
          
          let totalCalificacion = 0;
          let cantidadCalificaciones = 0;
          
          if (historialData && Array.isArray(historialData.data || historialData)) {
            const historialArray = historialData.data || historialData;

            historialArray.forEach(pedido => {
              if (pedido.calificaciones && Array.isArray(pedido.calificaciones) && pedido.calificaciones.length > 0) {
                pedido.calificaciones.forEach(calificacion => {
                  if 
                  (calificacion.calificacionRepartidor && calificacion.calificacionRepartidor > 0){
                    totalCalificacion += calificacion.calificacionRepartidor;
                    cantidadCalificaciones++;
                  }});
          }
        });
      }

      const calificacionPromedio = cantidadCalificaciones > 0 
            ? (totalCalificacion / cantidadCalificaciones).toFixed(1) 
            : 0;
          
          setStats({
            totalEntregas: historialData && Array.isArray(historialData.data || historialData) ? 
                           (historialData.data || historialData).length : 0,
            pedidosActivos: activosData && Array.isArray(activosData.data || activosData) ? 
                           (activosData.data || activosData).length : 0,
            calificacionPromedio,
            pedidosDisponibles: disponiblesData && Array.isArray(disponiblesData.data || disponiblesData) ? 
                               (disponiblesData.data || disponiblesData).length : 0
          });
          
          setLoading(false);
        } catch (error) {
          setError('No se pudieron cargar las estadísticas. Intente nuevamente.');
          setLoading(false);
        }
      };
    
    fetchRepartidorStats();
  }, []);
  
  const goToPedidosDisponibles = () => {
    navigate('/repartidor/pedidos-disponibles');
  };
  
  const goToPedidosActivos = () => {
    navigate('/repartidor/pedidos-activos');
  };
  
  if (loading) {
    return (
      <div className="repartidor-dashboard-loading">
        <div className="spinner"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="repartidor-dashboard-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }
  
  const navigateToChat = (pedidoId) => {
  navigate(`/repartidor/chat/${pedidoId}`);
};
  
  return (
    <div className="repartidor-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Bienvenido, {user?.nombreCompleto || 'Repartidor'}</h1>
          <p className="vehicle-info">
            <FaMotorcycle className="vehicle-icon" />
            <span>{user?.vehiculo || 'Vehículo no especificado'}</span>
          </p>
        </div>
      </div>
      
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon-container available">
            <FaMotorcycle className="stat-icon" />
          </div>
          <div className="stat-info">
            <h3>{stats.pedidosDisponibles}</h3>
            <p>Pedidos disponibles</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-container active">
            <FaMapMarkerAlt className="stat-icon" />
          </div>
          <div className="stat-info">
            <h3>{stats.pedidosActivos}</h3>
            <p>Entregas activas</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-container rating">
            <FaStar className="stat-icon" />
          </div>
          <div className="stat-info">
            <h3>{stats.calificacionPromedio}</h3>
            <p>Calificación promedio</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon-container history">
            <FaCalendarAlt className="stat-icon" />
          </div>
          <div className="stat-info">
            <h3>{stats.totalEntregas}</h3>
            <p>Total de entregas</p>
          </div>
        </div>
      </div>
      
      {stats.pedidosDisponibles > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Pedidos disponibles</h2>
            <button className="view-all-button" onClick={goToPedidosDisponibles}>
              Ver todos
            </button>
          </div>
          <PedidosDisponiblesPreview />
        </div>
      )}
      
      {stats.pedidosActivos > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Mi entrega en curso</h2>
          </div>
          <PedidosActivosPreview />
        </div>
      )}
      
      {stats.pedidosDisponibles === 0 && stats.pedidosActivos === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FaMotorcycle />
          </div>
          <h3>¡No hay pedidos disponibles en este momento!</h3>
          <p>Regresa más tarde para ver nuevos pedidos.</p>
        </div>
      )}
    </div>
  );
};

export default RepartidorDashboard;