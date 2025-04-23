
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import '../styles/Login.css';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [animateForm, setAnimateForm] = useState(false);

  // Añadir animación después de que el componente se monte
  useEffect(() => {
    setAnimateForm(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Llamada a la API para restablecer contraseña
      await api.post('/auth/reset-password', { 
        token, 
        newPassword: password 
      });
      
      setSuccess(true);
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Error al restablecer contraseña');
      } else {
        setError('Error al conectar con el servidor. Intenta de nuevo más tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className={`login-card ${animateForm ? 'animate-fade-in' : ''}`}>
        <h2 className="login-title">Restablecer contraseña</h2>
        
        {success ? (
          <div className="success-message">
            <p>¡Tu contraseña ha sido restablecida exitosamente!</p>
            <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <button 
              className="login-button" 
              onClick={() => navigate('/')}
            >
              Ir al inicio de sesión
            </button>
          </div>
        ) : (
          <>
            <div className="welcome-message">
              <p>Crea una nueva contraseña segura para tu cuenta</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <p className="input-label">Tu nueva contraseña debe tener al menos 6 caracteres</p>
              
              <div className="input-group">
                <div className="input-container">
                  <span className="input-icon">🔒</span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Nueva contraseña" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                
                <div className="input-container">
                  <span className="input-icon">🔒</span>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Confirmar nueva contraseña" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
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
                {isLoading ? 'Procesando...' : 'Restablecer contraseña'}
              </button>
            </form>
            
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
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;