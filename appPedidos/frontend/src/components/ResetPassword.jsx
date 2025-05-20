//
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import '../styles/ResetPassword.css';

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
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    setAnimateForm(true);
  }, []);

  useEffect(() => {
    // Evaluar la fuerza de la contraseña
    if (password.length === 0) {
      setPasswordStrength(0);
    } else if (password.length < 6) {
      setPasswordStrength(1); // Débil
    } else if (password.length >= 6 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      setPasswordStrength(3); // Fuerte
    } else {
      setPasswordStrength(2); // Media
    }
  }, [password]);

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

  const getPasswordStrengthText = () => {
    switch(passwordStrength) {
      case 1:
        return { text: 'Débil', color: '#e74c3c' };
      case 2:
        return { text: 'Media', color: '#f39c12' };
      case 3:
        return { text: 'Fuerte', color: '#27ae60' };
      default:
        return { text: '', color: '#ccc' };
    }
  };

  return (
    <div className="reset-container">
      <div className={`reset-card ${animateForm ? 'animate-fade-in' : ''}`}>
        <div className="card-header">
          <div className="logo-container">
            <span className="logo-icon">🍔</span>
            <h1 className="logo-text">FastFood</h1>
          </div>
          <h2 className="reset-title">Restablecer contraseña</h2>
        </div>
        
        {success ? (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <p>¡Tu contraseña ha sido restablecida exitosamente!</p>
            <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
            <button 
              className="primary-button" 
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
            
            <form onSubmit={handleSubmit} className="reset-form">
              <div className="form-description">
                <span className="info-icon">🔐</span>
                <p>Tu nueva contraseña debe tener al menos 6 caracteres. Te recomendamos incluir letras mayúsculas, minúsculas y números.</p>
              </div>
              
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
                
                {password && (
                  <div className="password-strength">
                    <div className="strength-bars">
                      <div className={`bar ${passwordStrength >= 1 ? 'active' : ''}`} style={{backgroundColor: passwordStrength >= 1 ? getPasswordStrengthText().color : ''}}></div>
                      <div className={`bar ${passwordStrength >= 2 ? 'active' : ''}`} style={{backgroundColor: passwordStrength >= 2 ? getPasswordStrengthText().color : ''}}></div>
                      <div className={`bar ${passwordStrength >= 3 ? 'active' : ''}`} style={{backgroundColor: passwordStrength >= 3 ? getPasswordStrengthText().color : ''}}></div>
                    </div>
                    <span className="strength-text" style={{color: getPasswordStrengthText().color}}>
                      {getPasswordStrengthText().text}
                    </span>
                  </div>
                )}
                
                <div className="input-container">
                  <span className="input-icon">🔐</span>
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
                className="primary-button" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading-text">
                    <span className="loading-spinner"></span>
                    Procesando...
                  </span>
                ) : 'Restablecer contraseña'}
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

export default ResetPassword;