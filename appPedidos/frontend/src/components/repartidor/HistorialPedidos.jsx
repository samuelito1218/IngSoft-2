import React, { useState, useEffect } from 'react';
import { FaHistory, FaStore, FaUser, FaCalendarAlt, FaComments } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom';
import ApiService from '../../services/api';
import '../../styles/HistorialPedidos.css';
import '../../styles/ChatPedido.css';

const HistorialPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const navigateToChat = (pedidoId) => {
    console.log("Navegando al chat del pedido:", pedidoId);
    navigate(`/repartidor/chat/${pedidoId}`);
  };
  
  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true);
        const response = await ApiService.pedidos.repartidorHistorial();
        
        if (response.data) {
          setPedidos(response.data);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar historial:', error);
        setError('No se pudo cargar el historial de pedidos. Intente nuevamente.');
        setLoading(false);
      }
    };
    
    fetchHistorial();
  }, []);
  
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
        <p>Pedidos que has completado</p>
      </div>
      
      {pedidos.length === 0 ? (
        <div className="empty-historial">
          <FaHistory className="empty-icon" />
          <h3>No tienes entregas completadas</h3>
          <p>Tu historial de entregas aparecerá aquí</p>
        </div>
      ) : (
        <div className="historial-grid">
          {pedidos.map((pedido) => (
            <div key={pedido.id} className="historial-card">
              <div className="historial-card-header">
                <div className="restaurante-info">
                  <FaStore className="icon" />
                  <h3>{pedido.restaurante?.nombre || 'Restaurante'}</h3>
                </div>
                <div className="estado-badge completed">
                  {pedido.estado === 'Entregado' ? 'Entregado' : 'Cancelado'}
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
                  <span className="total-amount">${pedido.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="chat-button"
                    onClick={() => navigateToChat(pedido.id)}
                    >
                      <FaComments />
                      <span>Chat</span>
                    </button>
    </div>
  );
};

export default HistorialPedidos;