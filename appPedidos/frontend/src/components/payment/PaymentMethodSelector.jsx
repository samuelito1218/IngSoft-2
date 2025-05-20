// src/components/payment/PaymentMethodSelector.jsx//
import React, { useState } from 'react';
import { FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import '../../styles/Payment.css';

const PaymentMethodSelector = ({ onChange, selected = 'efectivo' }) => {
  const [selectedMethod, setSelectedMethod] = useState(selected);

  const handleChange = (method) => {
    setSelectedMethod(method);
    if (onChange) {
      onChange(method);
    }
  };

  return (
    <div className="payment-methods">
      <div className="method-title">Método de pago</div>
      <div className="method-options">
        <div 
          className={`method-option ${selectedMethod === 'efectivo' ? 'selected' : ''}`}
          onClick={() => handleChange('efectivo')}
        >
          <input 
            type="radio" 
            id="payment-cash"
            className="method-radio" 
            checked={selectedMethod === 'efectivo'} 
            onChange={() => handleChange('efectivo')}
          />
          <span className="method-label">Efectivo</span>
          <span className="method-icon"><FaMoneyBillWave /></span>
        </div>
        
        <div 
          className={`method-option ${selectedMethod === 'tarjeta' ? 'selected' : ''}`}
          onClick={() => handleChange('tarjeta')}
        >
          <input 
            type="radio" 
            id="payment-card"
            className="method-radio" 
            checked={selectedMethod === 'tarjeta'} 
            onChange={() => handleChange('tarjeta')}
          />
          <span className="method-label">Tarjeta de crédito/débito</span>
          <span className="method-icon"><FaCreditCard /></span>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelector;