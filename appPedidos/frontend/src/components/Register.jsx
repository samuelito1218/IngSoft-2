import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import '../styles/Login.css';

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    cedula: '',
    direccion: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Datos para enviar a la API
      const userData = {
        nombreCompleto: formData.nombreCompleto,
        email: formData.email,
        password: formData.password,
        telefono: formData.telefono,
        cedula: formData.cedula,
        direccion: formData.direccion
      };
      
      // Llamada a la API para registro
      const response = await api.post('/auth/register', userData);
      
      // Guardar token y usuario
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      
      // Actualizar estado de autenticación
      login(user, token);
      
      // Redireccionar al dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Error de registro:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Error al registrar usuario');
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
        <h2 className="login-title">Registro</h2>
        
        <div className="welcome-message">
          <p>¡Bienvenido a FastFood! Registra tus datos para comenzar.</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <div className="input-container">
              <span className="input-icon">👤</span>
              <input 
                type="text" 
                name="nombreCompleto"
                placeholder="Nombre completo" 
                value={formData.nombreCompleto} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="input-container">
              <span className="input-icon">📧</span>
              <input 
                type="email" 
                name="email"
                placeholder="Correo electrónico" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="input-container">
              <span className="input-icon">📱</span>
              <input 
                type="tel" 
                name="telefono"
                placeholder="Teléfono" 
                value={formData.telefono} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="input-container">
              <span className="input-icon">🆔</span>
              <input 
                type="text" 
                name="cedula"
                placeholder="Cédula" 
                value={formData.cedula} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="input-container">
              <span className="input-icon">🏠</span>
              <input 
                type="text" 
                name="direccion"
                placeholder="Dirección" 
                value={formData.direccion} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="input-container">
              <span className="input-icon">🔒</span>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                placeholder="Contraseña" 
                value={formData.password} 
                onChange={handleChange} 
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
                name="confirmPassword"
                placeholder="Confirmar contraseña" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
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
            {isLoading ? 'Procesando...' : 'Registrarse'}
          </button>
        </form>
        
        <div className="divider">
          <hr />
        </div>
        
        <div className="register-option">
          <p>¿Ya tienes una cuenta?</p>
          <button 
            type="button" 
            className="register-link" 
            onClick={() => navigate('/')}
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;