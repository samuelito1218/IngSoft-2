import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ApiService from '../services/api';
import '../styles/Login.css';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
      
      const result = await login({ email, password });
      
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('token', result.token);
        } else {
          sessionStorage.setItem('token', result.token);
        }
        
        console.log("Login exitoso. Usuario:", result.user, "Token:", result.token);
        
      if (result.user.rol === 'Admin') {
        navigate('/admin'); 
      } else if (result.user.rol === 'Repartidor') {
        navigate('/repartidor');
      } else if (result.user.rol === 'Cliente') {
        console.log("Redirigiendo a /cliente");
        navigate('/cliente');
      } else {
        console.log("Rol no manejado:", result.user.rol, "redirigiendo a /dashboard");
        navigate('/dashboard');
      }
      } else {
        // Si el login no fue exitoso, mostrar el mensaje de error
        setError(result.message);
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      
      if (error.message && error.message.includes('network')) {
        setError('No se pudo conectar al servidor. Verifica que el backend esté funcionando.');
      } else if (error.message) {
        setError(error.message);
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
        <div className="card-header">
          <h2 className="login-title">FastFood</h2>
          
          <div className="welcome-message">
            <p>¡Hola, bienvenido de nuevo! 👋</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-label">Ingresa tu correo y contraseña</div>
          
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
            
            <div className="input-container">
              <span className="input-icon">🔒</span>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Contraseña" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="options-row">
            <div className="remember-me">
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe} 
                onChange={() => setRememberMe(!rememberMe)} 
              />
              <label htmlFor="remember">Recuérdame</label>
            </div>
            <button 
              type="button" 
              className="forgot-password" 
              onClick={() => navigate('/recover-password')}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-text">
                <span className="loading-spinner"></span>
                Cargando...
              </span>
            ) : 'Ingresar'}
          </button>
        </form>
        
        <div className="divider">
          <hr />
        </div>
        
        <div className="register-option">
          <p>¿No tienes cuenta aún?</p>
          <button 
            type="button" 
            className="register-link" 
            onClick={() => navigate('/register')}
          >
            Regístrate
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;