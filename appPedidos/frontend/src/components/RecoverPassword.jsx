import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';
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
    
    if (!email) {
      setError('Por favor ingresa tu correo electrónico');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      setError('Por favor ingresa un correo electrónico válido');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      await ApiService.auth.forgotPassword(email);
      
      setMessage(`Hemos enviado un correo de recuperación a ${email}. Por favor revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.`);
    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Error al procesar la solicitud');
      } else {
        setError('Error al conectar con el servidor. Intenta de nuevo más tarde.');
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