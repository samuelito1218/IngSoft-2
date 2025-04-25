import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/RecoverPassword.css';

function RecoverPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [animateForm, setAnimateForm] = useState(false);

  useEffect(() => {
    setAnimateForm(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      
      await api.post('/auth/forgot-password', { email });
      
      setMessage('Hemos enviado un correo de recuperación a tu dirección de email si existe en nuestra base de datos.');
    } catch (error) {
      console.error('Error al solicitar recuperación:', error);
      
      if (error.response && error.response.status !== 404) {
        setError('Ha ocurrido un error al procesar tu solicitud. Intenta nuevamente más tarde.');
      } else {
        setMessage('Hemos enviado un correo de recuperación a tu dirección de email si existe en nuestra base de datos.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="recover-container">
      <div className={`recover-card ${animateForm ? 'animate-fade-in' : ''}`}>
        <div className="card-header">
          <div className="logo-container">
            <span className="logo-icon">🍔</span>
            <h1 className="logo-text">FastFood</h1>
          </div>
          <h2 className="recover-title">Recuperar contraseña</h2>
        </div>
        
        {message ? (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <p>{message}</p>
            <button 
              className="primary-button" 
              onClick={() => navigate('/')}
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <>
            <div className="welcome-message">
              <p>¿Olvidaste tu contraseña? No te preocupes, te ayudaremos a recuperarla</p>
            </div>
            
            <form onSubmit={handleSubmit} className="recover-form">
              <div className="form-description">
                <span className="info-icon">ℹ️</span>
                <p>Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña</p>
              </div>
              
              <div className="input-group">
                <div className="input-container">
                  <span className="input-icon">📧</span>
                  <input 
                    type="email" 
                    placeholder="Correo electrónico" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button 
                type="submit" 
                className="primary-button" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading-text">
                    <span className="loading-spinner"></span>
                    Enviando...
                  </span>
                ) : 'Recuperar contraseña'}
              </button>
            </form>
            
            <div className="redirect-option">
              <p>¿Recordaste tu contraseña?</p>
              <button 
                type="button" 
                className="text-link" 
                onClick={() => navigate('/')}
              >
                Volver al inicio de sesión
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RecoverPassword;