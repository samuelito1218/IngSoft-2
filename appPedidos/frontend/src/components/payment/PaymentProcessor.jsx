// src/components/payment/PaymentProcessor.jsx//
import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { FaMoneyBillWave, FaArrowLeft } from 'react-icons/fa';
import PaymentMethodSelector from './PaymentMethodSelector';
import CreditCardForm from './CreditCardForm';
import api from '../../services/api';
import '../../styles/Payment.css';

// Inicializar Stripe con la clave pública
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const PaymentProcessor = ({ pedidoId, total, onSuccess, onCancel }) => {
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStep, setPaymentStep] = useState('method-selection');
  const [paymentProcessed, setPaymentProcessed] = useState(false);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const handleProceedToPayment = async () => {
    if (paymentMethod === 'efectivo') {
      // Procesar pago en efectivo
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.post(`/pagos/${pedidoId}/procesar`, {
          metodoPago: 'efectivo'
        });
        
        setPaymentProcessed(true);
        if (onSuccess) {
          onSuccess(response.data);
        }
      } catch (error) {
        console.error('Error al procesar pago en efectivo:', error);
        setError('Hubo un error al procesar el pago. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    } else if (paymentMethod === 'tarjeta') {
      // Preparar el pago con tarjeta obteniendo el clientSecret
      setPaymentStep('card-details');
      try {
        setLoading(true);
        setError(null);
        
        const response = await api.post(`/pagos/${pedidoId}/crear-intencion`);
        setClientSecret(response.data.clientSecret);
        
      } catch (error) {
        console.error('Error al crear intención de pago:', error);
        setError('Hubo un error al preparar el pago. Por favor, intenta de nuevo.');
        setPaymentStep('method-selection');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCardPaymentSuccess = async (paymentIntent) => {
    try {
      // Confirmar el pago en el backend
      await api.post(`/pagos/confirmar`, {
        paymentIntentId: paymentIntent.id
      });
      
      setPaymentProcessed(true);
      if (onSuccess) {
        onSuccess({
          success: true,
          paymentIntentId: paymentIntent.id,
          message: 'Pago procesado correctamente'
        });
      }
    } catch (error) {
      console.error('Error al confirmar pago:', error);
      setError('El pago se procesó pero hubo un error al confirmar. Contacta a soporte.');
    }
  };

  const handleCardPaymentError = (error) => {
    console.error('Error en el pago con tarjeta:', error);
    setError(error.message || 'Hubo un error al procesar el pago. Por favor, intenta de nuevo.');
  };

  const handleGoBack = () => {
    if (paymentStep === 'card-details') {
      setPaymentStep('method-selection');
    } else if (onCancel) {
      onCancel();
    }
  };

  // Renderizar diferente contenido según el estado actual
  const renderContent = () => {
    if (paymentProcessed) {
      return (
        <div className="payment-success">
          <div className="success-icon">✅</div>
          <h2>¡Pago procesado correctamente!</h2>
          <p>
            {paymentMethod === 'efectivo' 
              ? 'Recuerda pagar al repartidor cuando recibas tu pedido.' 
              : 'Tu pago con tarjeta ha sido procesado correctamente.'}
          </p>
          <button 
            className="continue-button"
            onClick={() => onSuccess ? onSuccess() : null}
          >
            Continuar
          </button>
        </div>
      );
    }

    if (paymentStep === 'method-selection') {
      return (
        <>
          <PaymentMethodSelector 
            onChange={handlePaymentMethodChange} 
            selected={paymentMethod} 
          />
          
          <div className="payment-summary">
            <div className="summary-row">
              <span>Total a pagar</span>
              <span className="total-amount">${total.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="payment-actions">
            <button 
              className="back-button"
              onClick={handleGoBack}
            >
              <FaArrowLeft /> Volver
            </button>
            <button 
              className="continue-button"
              onClick={handleProceedToPayment}
              disabled={loading}
            >
              {loading ? (
                <span className="loading-text">
                  <span className="loading-spinner"></span>
                  Procesando...
                </span>
              ) : (
                <>
                  {paymentMethod === 'efectivo' ? (
                    <>Confirmar pago en efectivo <FaMoneyBillWave /></>
                  ) : (
                    <>Continuar con el pago</>
                  )}
                </>
              )}
            </button>
          </div>
        </>
      );
    }

    if (paymentStep === 'card-details') {
      return (
        <>
          <h3 className="payment-step-title">Ingresa los datos de tu tarjeta</h3>
          
          {clientSecret ? (
            <Elements stripe={stripePromise}>
              <CreditCardForm 
                clientSecret={clientSecret}
                pedidoId={pedidoId}
                onSuccess={handleCardPaymentSuccess}
                onError={handleCardPaymentError}
              />
            </Elements>
          ) : (
            <div className="loading-container">
              <span className="loading-spinner large"></span>
              <p>Preparando el formulario de pago...</p>
            </div>
          )}
          
          <button 
            className="back-button text-only"
            onClick={() => setPaymentStep('method-selection')}
          >
            <FaArrowLeft /> Volver a métodos de pago
          </button>
        </>
      );
    }
  };

  return (
    <div className="payment-processor">
      <div className="payment-header">
        <h2>Proceso de pago</h2>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="payment-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default PaymentProcessor;