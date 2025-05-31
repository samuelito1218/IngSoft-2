import React from 'react';
import { FaMotorcycle, FaArrowRight } from 'react-icons/fa';
import './OrderActiveAlert.css';

const OrderActiveAlert = ({ pedido, onClick }) => {
  const getStatusEmoji = () => {
    switch (pedido.estado) {
      case 'Pendiente':
        return '⏳';
      case 'En_Camino':
        return '🛵';
      case 'Entregado':
        return '✅';
      default:
        return '🍔';
    }
  };
  
  const getStatusMessage = () => {
    switch (pedido.estado) {
      case 'Pendiente':
        return 'Tu pedido está siendo preparado';
      case 'En_Camino':
        return 'Tu pedido está en camino';
      case 'Entregado':
        return 'Tu pedido ha sido entregado';
      default:
        return 'Tienes un pedido activo';
    }
  };
  
  return (
    <div className="order-active-alert" onClick={onClick}>
      <div className="alert-icon">
        {getStatusEmoji()}
      </div>
      
      <div className="alert-content">
        <p className="alert-title">{getStatusMessage()}</p>
        <p className="alert-subtitle">Haz clic para ver detalles</p>
      </div>
      
      <div className="alert-action">
        <FaArrowRight />
      </div>
    </div>
  );
};

export default OrderActiveAlert;