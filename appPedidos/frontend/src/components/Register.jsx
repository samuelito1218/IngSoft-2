import React, { useState, useEffect } from 'react';
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
    direccion: '',
    comuna: '',
    rol: 'Cliente',
    vehiculo: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [animateForm, setAnimateForm] = useState(false);

  useEffect(() => {
    setAnimateForm(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const selectVehicle = (vehicleType) => {
    setFormData({
      ...formData,
      vehiculo: vehicleType
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que las contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Validar que si el rol es Repartidor, se haya seleccionado un vehículo
    if (formData.rol === 'Repartidor' && !formData.vehiculo) {
      setError('Por favor selecciona un tipo de vehículo');
      return;
    }

    // Validar que los campos numéricos sean válidos
    const telefonoNum = parseInt(formData.telefono);
    const cedulaNum = parseInt(formData.cedula);
    const comunaNum = parseInt(formData.comuna);

    if (isNaN(telefonoNum) || isNaN(cedulaNum) || isNaN(comunaNum)) {
      setError('Teléfono, cédula y comuna deben ser valores numéricos');
      setIsLoading(false);
      return;
    }

    // Validar email (expresión regular simple)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(formData.email)) {
      setError('El correo electrónico no es válido');
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
        telefono: telefonoNum.toString(),
        cedula: cedulaNum.toString(),
        direccion: formData.direccion,
        comuna: comunaNum.toString(),
        rol: formData.rol,
        vehiculo: formData.rol === 'Repartidor' ? formData.vehiculo : undefined
      };

      // Llamada a la API para registro
      const response = await api.post('/auth/register', userData);

      // Guardar token y usuario
      const { token, user } = response.data;
      localStorage.setItem('token', token);

      // Actualizar estado de autenticación
      login(user, token);

      // Redireccionar según el rol
      if (user.rol === 'Repartidor') {
        navigate('/repartidor');
      } else {
        navigate('/dashboard');
      }
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
      <div className={`login-card ${animateForm ? 'animate-fade-in' : ''}`}>
        <h2 className="login-title">Crea tu cuenta</h2>

        <div className="welcome-message">
          <p>¡Únete a FastFood y disfruta de comida a domicilio!</p>
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
                placeholder="Número de teléfono" 
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
                placeholder="Cédula de identidad" 
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
              <span className="input-icon">🏙️</span>
              <input 
                type="number" 
                name="comuna"
                placeholder="Comuna (número)" 
                value={formData.comuna} 
                onChange={handleChange} 
                required 
                min="1"
              />
            </div>

            {/* Selector de rol (solo Cliente o Repartidor) */}
            <div className="input-container">
              <span className="input-icon">👥</span>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="role-select"
                required
              >
                <option value="Cliente">Cliente</option>
                <option value="Repartidor">Repartidor</option>
              </select>
            </div>

            {/* Selector de vehículo para repartidores */}
            <div className={`vehicle-container ${formData.rol === 'Repartidor' ? 'show' : ''}`}>
              <div 
                className={`vehicle-option ${formData.vehiculo === 'Moto' ? 'selected' : ''}`}
                onClick={() => selectVehicle('Moto')}
              >
                <div className="vehicle-icon">🏍️</div>
                <div className="vehicle-name">Moto</div>
              </div>
              <div 
                className={`vehicle-option ${formData.vehiculo === 'Bicicleta' ? 'selected' : ''}`}
                onClick={() => selectVehicle('Bicicleta')}
              >
                <div className="vehicle-icon">🚲</div>
                <div className="vehicle-name">Bicicleta</div>
              </div>
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
            Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
