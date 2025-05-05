// src/components/client/RateOrder.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaRegStar, FaClock, FaUser, FaMotorcycle } from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import api from '../../../services/api';
import './RateOrder.css';

const RateOrder = () => {
  const { pedidoId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [pedido, setPedido] = useState(null);
  const [repartidor, setRepartidor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Estado para calificaciones
  const [repartidorRating, setRepartidorRating] = useState(5);
  const [pedidoRating, setPedidoRating] = useState(5);
  const [comentarios, setComentarios] = useState('');
  
  // Cargar información del pedido
  useEffect(() => {
    const fetchPedidoData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener información del pedido
        const response = await api.get(`/pedidos/${pedidoId}`);
        
        if (!response.data || !response.data.pedido) {
          throw new Error('No se encontró información del pedido');
        }
        
        const pedidoData = response.data.pedido;
        
        // Verificar si el pedido ya fue calificado
        const calificacionesResponse = await api.get(`/calificaciones/pedido/${pedidoId}`);
        if (calificacionesResponse.data && calificacionesResponse.data.calificado) {
          setError('Este pedido ya ha sido calificado');
          setLoading(false);
          return;
        }
        
        // Verificar que el pedido esté en estado Entregado
        if (pedidoData.estado !== 'Entregado') {
          setError('Solo puedes calificar pedidos entregados');
          setLoading(false);
          return;
        }
        
        setPedido(pedidoData);
        
        // Obtener información del repartidor si existe
        if (pedidoData.repartidor_Id) {
          const repartidorResponse = await api.get(`/usuarios/${pedidoData.repartidor_Id}`);
          if (repartidorResponse.data) {
            setRepartidor(repartidorResponse.data);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar información del pedido:', error);
        setError('No se pudo cargar la información del pedido. Intente nuevamente.');
        setLoading(false);
      }
    };
    
    fetchPedidoData();
  }, [pedidoId]);
  
  // Formatear fecha
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
  
  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };
  
  // Manejar hover sobre estrellas de repartidor
  const handleRepartidorHover = (rating) => {
    if (!submitting) {
      setRepartidorRating(rating);
    }
  };
  
  // Manejar hover sobre estrellas de pedido
  const handlePedidoHover = (rating) => {
    if (!submitting) {
      setPedidoRating(rating);
    }
  };
  
  // Manejar cambio en comentarios
  const handleComentariosChange = (e) => {
    setComentarios(e.target.value);
  };
  
  // Enviar calificación
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      // Crear objeto de calificación
      const calificacionData = {
        calificacionRepartidor: repartidorRating,
        calificacionPedido: pedidoRating,
        comentarios: comentarios.trim()
      };
      
      // Enviar calificación al backend
      const response = await api.post(`/calificaciones/calificar/${pedidoId}`, calificacionData);
      
      if (response.data && response.data.message) {
        setSuccess(true);
      } else {
        throw new Error('Error al enviar calificación');
      }
      
      setSubmitting(false);
    } catch (error) {
      console.error('Error al enviar calificación:', error);
      setError('No se pudo enviar la calificación. Intente nuevamente.');
      setSubmitting(false);
    }
  };
  
  // Volver a la página anterior
  const handleBack = () => {
    navigate(-1);
  };
  
  // Ver más pedidos
  const verPedidos = () => {
    navigate('/cliente/pedidos');
  };
  
  // Volver al inicio
  const volverInicio = () => {
    navigate('/cliente');
  };
  
  // Renderizar estrellas
  const renderStars = (currentRating, onHover, onSelect) => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i}
          className={`star ${i <= currentRating ? 'active' : ''}`}
          onMouseEnter={() => onHover(i)}
          onClick={() => onSelect(i)}
        >
          {i <= currentRating ? <FaStar /> : <FaRegStar />}
        </span>
      );
    }
    
    return stars;
  };
  
  if (loading) {
    return (
      <div className="rate-order-loading">
        <div className="spinner"></div>
        <p>Cargando información del pedido...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="rate-order-error">
        <p>{error}</p>
        <button onClick={handleBack} className="back-button">Volver</button>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="rate-order-success">
        <div className="success-icon">✓</div>
        <h2>¡Gracias por tu calificación!</h2>
        <p>Tu opinión es muy importante para nosotros y nos ayuda a mejorar nuestro servicio.</p>
        
        <div className="success-actions">
          <button className="primary-button" onClick={verPedidos}>
            Ver mis pedidos
          </button>
          <button className="secondary-button" onClick={volverInicio}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }
  
  if (!pedido) {
    return (
      <div className="rate-order-error">
        <p>No se encontró el pedido solicitado.</p>
        <button onClick={handleBack} className="back-button">Volver</button>
      </div>
    );
  }
  
  return (
    <div className="rate-order-page">
      <div className="rate-order-header">
        <button className="back-button" onClick={handleBack} disabled={submitting}>
          <FaArrowLeft />
        </button>
        <h1>Calificar Pedido</h1>
      </div>
      
      <div className="order-info-card">
        <div className="order-header">
          <div className="order-id">Pedido #{pedidoId.slice(-6)}</div>
          <div className="order-date">
            <FaClock />
            <span>{formatDate(pedido.fechaDeCreacion)}</span>
          </div>
        </div>
        
        {repartidor && (
          <div className="repartidor-info">
            <div className="info-icon">
              <FaUser />
            </div>
            <div className="repartidor-details">
              <h3>Repartidor</h3>
              <p>{repartidor.nombreCompleto}</p>
            </div>
          </div>
        )}
        
        <div className="order-details">
          <div className="detail-row">
            <span className="detail-label">Dirección:</span>
            <span className="detail-value">
              {pedido.direccionEntrega.direccionEspecifica}, {pedido.direccionEntrega.barrio}, 
              Comuna {pedido.direccionEntrega.comuna}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Total:</span>
            <span className="detail-value">{formatPrice(pedido.total)}</span>
          </div>
        </div>
      </div>
      
      <div className="rating-section">
        <div className="rating-card">
          <div className="rating-header">
            <div className="rating-icon">
              <FaMotorcycle />
            </div>
            <h2>Califica al repartidor</h2>
          </div>
          
          <div className="stars-container">
            {renderStars(
              repartidorRating, 
              handleRepartidorHover, 
              rating => !submitting && setRepartidorRating(rating)
            )}
          </div>
        </div>
        
        <div className="rating-card">
          <div className="rating-header">
            <div className="rating-icon">
              <FaStar />
            </div>
            <h2>Califica tu pedido</h2>
          </div>
          
          <div className="stars-container">
            {renderStars(
              pedidoRating, 
              handlePedidoHover, 
              rating => !submitting && setPedidoRating(rating)
            )}
          </div>
        </div>
      </div>
      
      <div className="comments-section">
        <h3>Comentarios adicionales</h3>
        <textarea
          placeholder="Cuéntanos más sobre tu experiencia..."
          value={comentarios}
          onChange={handleComentariosChange}
          disabled={submitting}
          rows={4}
        ></textarea>
      </div>
      
      <div className="rating-actions">
        <button 
          className="cancel-button" 
          onClick={handleBack}
          disabled={submitting}
        >
          Cancelar
        </button>
        <button 
          className="submit-button" 
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Enviando...' : 'Enviar calificación'}
        </button>
      </div>
    </div>
  );
};

export default RateOrder;