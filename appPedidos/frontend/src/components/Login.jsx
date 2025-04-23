import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      
      // Llamada a la API para iniciar sesión
      const response = await api.post('/auth/login', { email, password });
      
      // Guardar token según la preferencia del usuario
      const { token, user } = response.data;
      
      if (rememberMe) {
        localStorage.setItem('token', token);
      } else {
        sessionStorage.setItem('token', token);
      }
      
      // Actualizar estado de autenticación en el contexto
      login(user, token);
      
      // Redireccionar según el rol
      if (user.rol === 'Admin') {
        navigate('/admin');
      } else if (user.rol === 'Repartidor') {
        navigate('/repartidor');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Credenciales inválidas');
      } else {
        setError('Error al conectar con el servidor. Intenta de nuevo más tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Iniciar Sesión</h2>
        
        <div className="welcome-message">
          <p>¡Hola, es un gusto verte de nuevo en FastFood!👋</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <p className="input-label">Ingresa tu correo y contraseña</p>
          
          <div className="input-group">
            <div className="input-container">
              <span className="input-icon">📧</span>
              <input 
                type="email" 
                placeholder="Correo" 
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
            {isLoading ? 'Cargando...' : 'Ingresar'}
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