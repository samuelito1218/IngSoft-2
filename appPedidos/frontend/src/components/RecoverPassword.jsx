import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/Login.css';

function RecoverPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      
      // Llamada real a la API para solicitar recuperación
      await api.post('/auth/forgot-password', { email });
      
      // Mostrar mensaje de éxito (incluso si el correo no existe por seguridad)
      setMessage('Se ha enviado un correo de recuperación a tu dirección de email si existe en nuestra base de datos.');
    } catch (error) {
      console.error('Error al solicitar recuperación:', error);
      
      // Solo mostrar errores de servidor, no de usuario no encontrado (por seguridad)
      if (error.response && error.response.status !== 404) {
        setError('Ha ocurrido un error al procesar tu solicitud. Intenta nuevamente más tarde.');
      } else {
        // Aún mostrar el mensaje de éxito para evitar enumerar usuarios
        setMessage('Se ha enviado un correo de recuperación a tu dirección de email si existe en nuestra base de datos.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Recuperar Contraseña</h2>
        
        {message ? (
          <div className="success-message">
            <p>{message}</p>
            <button 
              className="login-button" 
              onClick={() => navigate('/')}
            >
              Volver al inicio de sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="input-label">Ingresa tu correo electrónico para recuperar tu contraseña</p>
            
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
              className="login-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Recuperar contraseña'}
            </button>
          </form>
        )}
        
        <div className="register-option">
          <p>¿Recordaste tu contraseña?</p>
          <button 
            type="button" 
            className="register-link" 
            onClick={() => navigate('/')}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecoverPassword;