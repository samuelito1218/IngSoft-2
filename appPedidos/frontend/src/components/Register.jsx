import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ApiService, { api } from '../services/api';
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
    vehiculo: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [animateForm, setAnimateForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const [validatingCedula, setValidatingCedula] = useState(false);
  const [validatingTelefono, setValidatingTelefono] = useState(false);
  const [cedulaError, setCedulaError] = useState('');
  const [telefonoError, setTelefonoError] = useState('');
  const [cedulaValid, setCedulaValid] = useState(false);
  const [telefonoValid, setTelefonoValid] = useState(false);

  const getTotalSteps = () => {
    return 2;
  };

  useEffect(() => {
    setAnimateForm(true);
  }, []);

  useEffect(() => {
    const errors = [];
    
    if (formData.password.length > 0 && formData.password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (formData.password.length > 0 && !/[A-Z]/.test(formData.password)) {
      errors.push('La contraseña debe incluir al menos una letra mayúscula');
    }
    
    if (formData.password.length > 0 && !/[0-9]/.test(formData.password)) {
      errors.push('La contraseña debe incluir al menos un número');
    }
    
    setPasswordErrors(errors);
    
    if (formData.password.length === 0) {
      setPasswordStrength(0);
    } else if (errors.length >= 2) {
      setPasswordStrength(1);
    } else if (errors.length === 1) {
      setPasswordStrength(2);
    } else {
      setPasswordStrength(3);
    }
  }, [formData.password]);

  useEffect(() => {
    const validateCedula = async () => {
      if (formData.cedula && formData.cedula.length >= 5) {
        try {
          setValidatingCedula(true);
          setCedulaError('');
          
          const response = await ApiService.auth.validateCedula(formData.cedula);
          
          setCedulaValid(true);
          setValidatingCedula(false);
        } catch (error) {
          if (error.response && error.response.status === 409) {
            setCedulaError('Esta cédula ya está registrada en el sistema');
            setCedulaValid(false);
          }
          setValidatingCedula(false);
        }
      } else {
        setCedulaValid(false);
        setCedulaError('');
      }
    };

    const timeoutId = setTimeout(() => {
      if (formData.cedula && formData.cedula.length >= 5) {
        validateCedula();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.cedula]);

  useEffect(() => {
    const validateTelefono = async () => {
      if (formData.telefono && formData.telefono.length >= 6) {
        try {
          setValidatingTelefono(true);
          setTelefonoError('');
          
          const response = await ApiService.auth.validateTelefono(formData.telefono);
          
          setTelefonoValid(true);
          setValidatingTelefono(false);
        } catch (error) {
          if (error.response && error.response.status === 409) {
            setTelefonoError('Este número de teléfono ya está registrado');
            setTelefonoValid(false);
          }
          setValidatingTelefono(false);
        }
      } else {
        setTelefonoValid(false);
        setTelefonoError('');
      }
    };

    const timeoutId = setTimeout(() => {
      if (formData.telefono && formData.telefono.length >= 6) {
        validateTelefono();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.telefono]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (name === 'cedula') {
      setCedulaError('');
    } else if (name === 'telefono') {
      setTelefonoError('');
    }
  };

  const selectVehicle = (vehicleType) => {
    setFormData({
      ...formData,
      vehiculo: vehicleType
    });
  };

  const nextStep = () => {
    setError('');
    
    if (formStep === 1) {
      if (!formData.nombreCompleto || !formData.email || !formData.telefono || !formData.cedula) {
        setError('Por favor completa todos los campos');
        return;
      }
      
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(formData.email)) {
        setError('El correo electrónico no es válido');
        return;
      }
      
      if (cedulaError) {
        setError(cedulaError);
        return;
      }
      
      if (telefonoError) {
        setError(telefonoError);
        return;
      }
      
      setFormStep(2);
    }
  };

  const prevStep = () => {
    setError('');
    if (formStep > 1) {
      setFormStep(formStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwordStrength < 3) {
      setError('La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.rol === 'Repartidor' && !formData.vehiculo) {
      setError('Por favor selecciona un tipo de vehículo');
      return;
    }

    const telefonoNum = parseInt(formData.telefono);
    const cedulaNum = parseInt(formData.cedula);
    const comunaNum = parseInt(formData.comuna);

    if (isNaN(telefonoNum) || isNaN(cedulaNum) || isNaN(comunaNum)) {
      setError('Teléfono, cédula y comuna deben ser valores numéricos');
      return;
    }

    if (cedulaError || telefonoError) {
      setError(cedulaError || telefonoError);
      return;
    }

    try {
      setIsLoading(true);

      const userData = {
        nombreCompleto: formData.nombreCompleto,
        email: formData.email,
        password: formData.password,
        telefono: telefonoNum.toString(),
        cedula: cedulaNum.toString(),
        direccion: formData.direccion,
        comuna: comunaNum.toString(),
        rol: formData.rol,
        vehiculo: formData.rol === 'Repartidor' ? formData.vehiculo : undefined,
        verificado: true
      };

      const response = await ApiService.auth.register(userData);
      
      const { token, user } = response.data;
      
      setRegistrationSuccess(true);
      
      let mensaje = '';
      if (formData.rol === 'Admin') {
        mensaje = `¡Tu cuenta de Administrador ha sido creada exitosamente! Ahora puedes iniciar sesión como ${formData.email} para gestionar tu restaurante. Verifica en tu bandeja de entrada o spam`;
      } else if (formData.rol === 'Repartidor') {
        mensaje = `¡Bienvenido al equipo de repartidores de FastFood! Tu cuenta ha sido creada exitosamente. Inicia sesión como ${formData.email} para comenzar a recibir pedidos. Verifica en tu bandeja de entrada o spam`;
      } else {
        mensaje = `¡Bienvenido a FastFood! Tu cuenta ha sido creada exitosamente. Ahora puedes iniciar sesión como ${formData.email} y comenzar a pedir tu comida favorita. Verifica en tu bandeja de entrada o spam`;
      }
      
      setSuccessMessage(mensaje);
      setIsLoading(false);
      
    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Error al registrar usuario');
      } else {
        setError('Error al conectar con el servidor. Intenta de nuevo más tarde.');
      }
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

  if (registrationSuccess) {
    return (
      <div className="register-container">
        <div className={`register-card ${animateForm ? 'animate-fade-in' : ''}`}>
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>¡Registro Exitoso!</h2>
            <p>{successMessage}</p>
            <div className="confetti-animation">
              <div className="confetti confetti-1">🎉</div>
              <div className="confetti confetti-2">🎊</div>
              <div className="confetti confetti-3">✨</div>
            </div>
            <button 
              type="button" 
              className="primary-button" 
              onClick={() => navigate('/')}
            >
              Ir al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className={`register-card ${animateForm ? 'animate-fade-in' : ''}`}>
        <div className="card-header">
          <div className="logo-container">
            <span className="logo-icon">🍔</span>
            <h1 className="logo-text">FastFood</h1>
          </div>
          <h2 className="register-title">Crea tu cuenta</h2>
          <div className="welcome-message">
            <p>¡Únete a FastFood y disfruta de comida a domicilio!</p>
          </div>
        </div>

        <div className="progress-steps">
          {Array.from({ length: getTotalSteps() }, (_, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className={`step-connector ${formStep > i ? 'active' : ''}`}></div>}
              <div className={`step ${formStep > i ? 'active' : ''} ${formStep === i + 1 ? 'current' : ''}`}>{i + 1}</div>
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {formStep === 1 && (
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
                    {validatingTelefono && <span className="validating-indicator">Validando...</span>}
                    {telefonoValid && <span className="valid-indicator">✓</span>}
                  </div>
                  {telefonoError && <div className="field-error">{telefonoError}</div>}

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
                    {validatingCedula && <span className="validating-indicator">Validando...</span>}
                    {cedulaValid && <span className="valid-indicator">✓</span>}
                  </div>
                  {cedulaError && <div className="field-error">{cedulaError}</div>}

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
                      <option value="Admin">Administrador de Restaurante</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {formStep === 2 && (
            <>
              <div className="form-group">
                <h3 className="step-title">Ubicación y seguridad</h3>
                
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

                  <div className="input-container password-section">
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
                    <>
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
                      
                      {passwordErrors.length > 0 && (
                        <div className="password-requirements">
                          <p>Tu contraseña debe cumplir los siguientes requisitos:</p>
                          <ul>
                            {passwordErrors.map((error, index) => (
                              <li key={index} className="requirement-item">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}

                  <div className="input-container password-section">
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
                  
                  {formData.password && formData.confirmPassword && (
                    <div className={formData.password === formData.confirmPassword ? "password-match" : "password-mismatch"}>
                      {formData.password === formData.confirmPassword 
                        ? "✓ Las contraseñas coinciden" 
                        : "✗ Las contraseñas no coinciden"}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="form-buttons">
            {formStep > 1 && (
              <button 
                type="button" 
                className="back-button" 
                onClick={prevStep}
                disabled={isLoading}
              >
                Atrás
              </button>
            )}
            
            {(formStep < getTotalSteps()) ? (
              <button 
                type="button" 
                className="next-button" 
                onClick={nextStep}
                disabled={isLoading || validatingCedula || validatingTelefono}
              >
                Siguiente
              </button>
            ) : (
              <button 
                type="submit" 
                className="register-button" 
                disabled={isLoading || passwordStrength < 3 || formData.password !== formData.confirmPassword}
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