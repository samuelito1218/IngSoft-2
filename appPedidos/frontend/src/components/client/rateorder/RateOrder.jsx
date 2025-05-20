// src/components/client/RateOrder.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaStar, FaRegStar, FaClock, FaUser, FaMotorcycle } from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import ApiService from '../../../services/api';
import axios from 'axios'; //Nueva importación
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
        
        // Obtener información del pedido usando ApiService
        const responsePedido = await ApiService.pedidos.detalle(pedidoId);
        
        if (!responsePedido.data || !responsePedido.data.pedido) {
          throw new Error('No se encontró información del pedido');
        }
        
        const pedidoData = responsePedido.data.pedido;
        
        // Verificar que el pedido esté en estado Entregado
        if (pedidoData.estado !== 'Entregado') {
          setError('Solo puedes calificar pedidos entregados');
          setLoading(false);
          return;
        }
        
        setPedido(pedidoData);
        
        // Obtener información del repartidor si existe
        if (pedidoData.repartidor_Id) {
          try {
            // Verificar si tenemos el método implementado
            if (typeof ApiService.usuarios.obtenerUsuario === 'function') {
              const repartidorResponse = await ApiService.usuarios.obtenerUsuario(pedidoData.repartidor_Id);
              if (repartidorResponse.data) {
                setRepartidor(repartidorResponse.data);
              }
            } else {
              // Si el método no existe, usar información del repartidor de la respuesta del pedido
              if (responsePedido.data.repartidor) {
                setRepartidor(responsePedido.data.repartidor);
              } else {
                // Usar información mínima
                setRepartidor({
                  nombreCompleto: 'Repartidor #' + pedidoData.repartidor_Id.slice(-4)
                });
              }
            }
          } catch (repartidorError) {
            console.error('Error al obtener información del repartidor:', repartidorError);
            // Si falla, mostrar información básica
            setRepartidor({
              nombreCompleto: 'Repartidor #' + pedidoData.repartidor_Id.slice(-4)
            });
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
      calificacionRepartidor: Number(repartidorRating),
      calificacionPedido: Number(pedidoRating),
      comentarios: comentarios.trim()
    };
    
    console.log(`Enviando calificación para pedido ${pedidoId}:`, calificacionData);
    
    // Intentar con ApiService
    try {
      const response = await ApiService.pedidos.calificar(pedidoId, calificacionData);
      console.log('Respuesta del servidor (calificar):', response);
      
      if (response.data && (response.data.message || response.status === 200 || response.status === 201)) {
        setSuccess(true);
        setSubmitting(false);
        return; // Salir si es exitoso
      }
    } catch (apiError) {
      console.error('Error con ApiService.pedidos.calificar:', apiError);
      
      // Verificar errores específicos que podrían dar pistas
      if (apiError.response) {
        console.log('Respuesta de error:', apiError.response.data);
        console.log('Estado del error:', apiError.response.status);
        console.log('Headers de respuesta:', apiError.response.headers);

        console.log('Error detallado:', JSON.stringify(apiError, null, 2));
        
        // Manejar errores específicos del servidor
        if (apiError.response.status === 400 && apiError.response.data.message) {
          console.log("Error interno del servidor, verificar los logs del servidor");
          setError(apiError.response.data.message);
          setSubmitting(false);
          return; // Salir para mostrar el mensaje de error específico
        }
      }
      
      // Intentar directamente con axios como último recurso
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
        
        console.log('Respuesta directa de axios:', axiosResponse);
        if (axiosResponse.data) {
          setSuccess(true);
          setSubmitting(false);
          return;
        }
      } catch (axiosError) {
        console.error('Error con llamada directa de axios:', axiosError);
        
        if (axiosError.response && axiosError.response.data && axiosError.response.data.message) {
          // Usar el mensaje de error del servidor si está disponible
          setError(axiosError.response.data.message);
        } else {
          // Mensaje genérico
          setError('No se pudo enviar la calificación. Intente nuevamente.');
        }
        
        setSubmitting(false);
        return;
      }
    }
    
    // Si llegamos aquí, algo falló sin un error específico
    setError('No se pudo procesar la calificación. Intente nuevamente más tarde.');
    setSubmitting(false);
  } catch (error) {
    console.error('Error al enviar calificación:', error);
    setError('Ocurrió un error inesperado. Intente nuevamente.');
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