// src/components/payment/CreditCardForm.jsx//
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaLock } from 'react-icons/fa';
import '../../styles/Payment.css';

const cardOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#333',
      fontFamily: 'Arial, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
  hidePostalCode: true,
};

const CreditCardForm = ({ clientSecret, pedidoId, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            // Puedes añadir detalles de facturación si es necesario
          },
        },
      });

      if (result.error) {
        setError(result.error.message);
        if (onError) {
          onError(result.error);
        }
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          // Notificar el éxito al componente padre
          if (onSuccess) {
            onSuccess(result.paymentIntent);
          }
        }
      }
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      setError('Hubo un error al procesar el pago. Por favor, intenta de nuevo.');
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-payment-form">
      <div className="secure-badge">
        <FaLock /> Pago seguro
      </div>
      <form onSubmit={handleSubmit}>
        <div className="card-element-container">
          <CardElement options={cardOptions} />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button 
          type="submit" 
          className="pay-button" 
          disabled={!stripe || loading}
        >
          {loading ? (
            <span className="loading-text">
              <span className="loading-spinner"></span>
              Procesando...
            </span>
          ) : 'Pagar ahora'}
        </button>
      </form>
      
      <div className="secured-by">
        <div className="powered-by-stripe">
          <span>Pago seguro con</span>
          <img src="/images/powered-by-stripe.svg" alt="Powered by Stripe" />
        </div>
      </div>
    </div>
  );
};

export default CreditCardForm;