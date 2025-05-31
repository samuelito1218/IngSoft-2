import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaRegStar, FaClock, FaUser, FaMotorcycle } from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import ApiService from '../../../services/api';
import axios from 'axios';
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
  const [repartidorRating, setRepartidorRating] = useState(5);
  const [pedidoRating, setPedidoRating] = useState(5);
  const [comentarios, setComentarios] = useState('');
  
  useEffect(() => {
    const fetchPedidoData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const responsePedido = await ApiService.pedidos.detalle(pedidoId);
        
        if (!responsePedido.data || !responsePedido.data.pedido) {
          throw new Error('No se encontró información del pedido');
        }
        
        const pedidoData = responsePedido.data.pedido;
        
        if (pedidoData.estado !== 'Entregado') {
          setError('Solo puedes calificar pedidos entregados');
          setLoading(false);
          return;
        }
        
        setPedido(pedidoData);
        
        if (pedidoData.repartidor_Id) {
          try {
            if (typeof ApiService.usuarios.obtenerUsuario === 'function') {
              const repartidorResponse = await ApiService.usuarios.obtenerUsuario(pedidoData.repartidor_Id);
              if (repartidorResponse.data) {
                setRepartidor(repartidorResponse.data);
              }
            } else {
              if (responsePedido.data.repartidor) {
                setRepartidor(responsePedido.data.repartidor);
              } else {
                setRepartidor({
                  nombreCompleto: 'Repartidor #' + pedidoData.repartidor_Id.slice(-4)
                });
              }
            }
          } catch (repartidorError) {
            setRepartidor({
              nombreCompleto: 'Repartidor #' + pedidoData.repartidor_Id.slice(-4)
            });
          }
        }
        
        setLoading(false);
      } catch (error) {
        setError('No se pudo cargar la información del pedido. Intente nuevamente.');
        setLoading(false);
      }
    };
    
    fetchPedidoData();
  }, [pedidoId]);
  
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
  
  const handleRepartidorHover = (rating) => {
    if (!submitting) {
      setRepartidorRating(rating);
    }
  };
  
  const handlePedidoHover = (rating) => {
    if (!submitting) {
      setPedidoRating(rating);
    }
  };
  
  const handleComentariosChange = (e) => {
    setComentarios(e.target.value);
  };
  
  const handleSubmit = async () => {
  try {
    setSubmitting(true);
    setError(null);
    
    const calificacionData = {
      calificacionRepartidor: Number(repartidorRating),
      calificacionPedido: Number(pedidoRating),
      comentarios: comentarios.trim()
    };
    
    try {
      const response = await ApiService.pedidos.calificar(pedidoId, calificacionData);
      
      if (response.data && (response.data.message || response.status === 200 || response.status === 201)) {
        setSuccess(true);
        setSubmitting(false);
        return;
      }
    } catch (apiError) {
      if (apiError.response) {
        if (apiError.response.status === 400 && apiError.response.data.message) {
          setError(apiError.response.data.message);
          setSubmitting(false);
          return;
        }
      }
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No hay token de autenticación');
        }
        
        const axiosResponse = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/calificaciones/calificar/${pedidoId}`, 
          calificacionData,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (axiosResponse.data) {
          setSuccess(true);
          setSubmitting(false);
          return;
        }
      } catch (axiosError) {
        if (axiosError.response && axiosError.response.data && axiosError.response.data.message) {
          setError(axiosError.response.data.message);
        } else {
          setError('No se pudo enviar la calificación. Intente nuevamente.');
        }
        
        setSubmitting(false);
        return;
      }
    }
    
    setError('No se pudo procesar la calificación. Intente nuevamente más tarde.');
    setSubmitting(false);
  } catch (error) {
    setError('Ocurrió un error inesperado. Intente nuevamente.');
    setSubmitting(false);
  }
};
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const verPedidos = () => {
    navigate('/cliente/pedidos');
  };
  
  const volverInicio = () => {
    navigate('/cliente');
  };
  
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
              {repartidor.vehiculo && (
                <p className="repartidor-vehiculo">
                  <small>Vehículo: {repartidor.vehiculo}</small>
                </p>
              )}
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