import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import '../styles/Register.css';

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
  const [formStep, setFormStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    setAnimateForm(true);
  }, []);

  useEffect(() => {
    // Evaluar la fuerza de la contraseña
    if (formData.password.length === 0) {
      setPasswordStrength(0);
    } else if (formData.password.length < 6) {
      setPasswordStrength(1); // Débil
    } else if (formData.password.length >= 6 && /[A-Z]/.test(formData.password) && /[0-9]/.test(formData.password)) {
      setPasswordStrength(3); // Fuerte
    } else {
      setPasswordStrength(2); // Media
    }
  }, [formData.password]);

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

  const nextStep = () => {
    if (formStep === 1) {
      // Validar campos del primer paso
      if (!formData.nombreCompleto || !formData.email || !formData.telefono) {
        setError('Por favor completa todos los campos');
        return;
      }
      
      // Validar email
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(formData.email)) {
        setError('El correo electrónico no es válido');
        return;
      }
      
      setError('');
      setFormStep(2);
    }
  };

  const prevStep = () => {
    setError('');
    setFormStep(1);
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
    <div className="register-container">
      <div className={`register-card ${animateForm ? 'animate-fade-in' : ''}`}>
        <div className="card-header">
          <div className="logo-container">
            <span className="logo-icon">🍔</span>
            <h1 className="logo-text">FastFood</h1>
          </div>
          <h2 className="register-title">Crea tu cuenta</h2>
        </div>

        <div className="welcome-message">
          <p>¡Únete a FastFood y disfruta de comida a domicilio!</p>
        </div>

        <div className="progress-steps">
          <div className={`step ${formStep >= 1 ? 'active' : ''}`}>1</div>
          <div className="step-connector"></div>
          <div className={`step ${formStep >= 2 ? 'active' : ''}`}>2</div>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {formStep === 1 ? (
            <>
              <div className="form-group">
                <h3 className="step-title">Información personal</h3>
                
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
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <h3 className="step-title">Dirección y tipo de cuenta</h3>
                
                <div className="input-group">
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

                  {formData.rol === 'Repartidor' && (
                    <div className="vehicle-selection">
                      <div className="form-label">Selecciona tu vehículo:</div>
                      <div className="vehicle-container">
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
                    </div>
                  )}

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

                  {formData.password && (
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
              </div>
            </>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="form-buttons">
            {formStep === 2 && (
              <button 
                type="button" 
                className="back-button" 
                onClick={prevStep}
              >
                Atrás
              </button>
            )}
            
            {formStep === 1 ? (
              <button 
                type="button" 
                className="next-button" 
                onClick={nextStep}
              >
                Siguiente
              </button>
            ) : (
              <button 
                type="submit" 
                className="register-button" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading-text">
                    <span className="loading-spinner"></span>
                    Procesando...
                  </span>
                ) : 'Registrarse'}
              </button>
            )}
          </div>
        </form>

        <div className="divider">
          <hr />
        </div>

        <div className="login-option">
          <p>¿Ya tienes una cuenta?</p>
          <button 
            type="button" 
            className="login-link" 
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