import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ApiService from '../services/api';
import '../styles/ResetPassword.css';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [animateForm, setAnimateForm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const [validations, setValidations] = useState({
    minLength: false,
    hasUppercase: false,
    passwordsMatch: false
  });

  useEffect(() => {
    setAnimateForm(true);
  }, []);

  useEffect(() => {
    const minLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const passwordsMatch = password === confirmPassword && password !== '';
    
    setValidations({
      minLength,
      hasUppercase,
      passwordsMatch
    });
    
    if (password.length === 0) {
      setPasswordStrength(0);
    } else if (!minLength || !hasUppercase) {
      setPasswordStrength(1);
    } else if (minLength && hasUppercase && /[0-9]/.test(password)) {
      setPasswordStrength(3);
    } else {
      setPasswordStrength(2);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validations.minLength) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    if (!validations.hasUppercase) {
      setError('La contraseña debe tener al menos una letra mayúscula');
      return;
    }
    
    if (!validations.passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      await ApiService.auth.resetPasswordForgot(token, password);
      
      setSuccess(true);
    } catch (error) {
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
                <p>Tu nueva contraseña debe tener al menos 8 caracteres e incluir al menos una letra mayúscula.</p>
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
                  <div className="password-requirements">
                    <div className={`requirement ${validations.minLength ? 'valid' : 'invalid'}`}>
                      <span className="requirement-icon">
                        {validations.minLength ? '✓' : '✗'}
                      </span>
                      <span>Mínimo 8 caracteres</span>
                    </div>
                    <div className={`requirement ${validations.hasUppercase ? 'valid' : 'invalid'}`}>
                      <span className="requirement-icon">
                        {validations.hasUppercase ? '✓' : '✗'}
                      </span>
                      <span>Al menos una letra mayúscula</span>
                    </div>
                  </div>
                )}
                
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
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="Confirmar nueva contraseña" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
                
                {confirmPassword && (
                  <div className={`password-match ${validations.passwordsMatch ? 'valid' : 'invalid'}`}>
                    <span className="match-icon">
                      {validations.passwordsMatch ? '✓' : '✗'}
                    </span>
                    <span>
                      {validations.passwordsMatch 
                        ? 'Las contraseñas coinciden' 
                        : 'Las contraseñas no coinciden'}
                    </span>
                  </div>
                )}
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button 
                type="submit" 
                className="primary-button" 
                disabled={isLoading || !validations.minLength || !validations.hasUppercase || !validations.passwordsMatch}
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