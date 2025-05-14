import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ApiService, { api } from '../services/api';
//import ApiService from '../services/api';
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
    // Datos para restaurante (si es Admin)
    restauranteNombre: '',
    sucursales: [{ 
      comuna: '', 
      direccion: '' 
    }]
  });

  const [documentoLegal, setDocumentoLegal] = useState(null);
  const [documentoNombre, setDocumentoNombre] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [animateForm, setAnimateForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  // Calcular número total de pasos según el rol
  const getTotalSteps = () => {
    return formData.rol === 'Admin' ? 3 : 2;
  };

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

  const handleSucursalChange = (index, field, value) => {
    const updatedSucursales = [...formData.sucursales];
    updatedSucursales[index] = {
      ...updatedSucursales[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      sucursales: updatedSucursales
    });
  };

  const addSucursal = () => {
    setFormData({
      ...formData,
      sucursales: [...formData.sucursales, { comuna: '', direccion: '' }]
    });
  };

  const removeSucursal = (index) => {
    if (formData.sucursales.length > 1) {
      const updatedSucursales = [...formData.sucursales];
      updatedSucursales.splice(index, 1);
      setFormData({
        ...formData,
        sucursales: updatedSucursales
      });
    } else {
      setError('Debe tener al menos una sucursal');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
        setDocumentoLegal(file);
        setDocumentoNombre(file.name);
        setError('');
      } else {
        setError('Por favor seleccione un PDF de máximo 5MB');
        setDocumentoLegal(null);
        setDocumentoNombre('');
      }
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
      // Validar campos del primer paso
      if (!formData.nombreCompleto || !formData.email || !formData.telefono || !formData.cedula) {
        setError('Por favor completa todos los campos');
        return;
      }
      
      // Validar email
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      if (!emailRegex.test(formData.email)) {
        setError('El correo electrónico no es válido');
        return;
      }
      
      setFormStep(2);
    } else if (formStep === 2 && formData.rol === 'Admin') {
      // Validar campos del segundo paso para Admin
      if (!formData.password || !formData.confirmPassword || !formData.direccion || !formData.comuna) {
        setError('Por favor completa todos los campos');
        return;
      }

      // Validar que las contraseñas coincidan
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      
      setFormStep(3);
    }
  };

  const prevStep = () => {
    setError('');
    if (formStep > 1) {
      setFormStep(formStep - 1);
    }
  };

  const validateRestauranteData = () => {
    if (!formData.restauranteNombre) {
      setError('Por favor ingrese el nombre del restaurante');
      return false;
    }

    // Validar que al menos haya una sucursal con datos completos
    const sucursalValida = formData.sucursales.some(
      sucursal => sucursal.comuna && sucursal.direccion
    );

    if (!sucursalValida) {
      setError('Por favor complete los datos de al menos una sucursal');
      return false;
    }

    if (formData.rol === 'Admin' && !documentoLegal) {
      setError('Por favor adjunte los documentos legales del restaurante');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Si es el último paso para Admin, validar datos del restaurante
    if (formData.rol === 'Admin' && formStep === 3) {
      if (!validateRestauranteData()) {
        return;
      }
    }

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

      // Llamada a la API para registro de usuario
      const response = await ApiService.auth.register(userData);

      // Si es Admin, enviar datos del restaurante después del registro exitoso
      if (formData.rol === 'Admin' && response.data.user && response.data.token) {
        // Guardar token para las siguientes peticiones
        localStorage.setItem('token', response.data.token);
        
        // Crear FormData para enviar el documento
        const formDataUpload = new FormData();
        formDataUpload.append('nombre', formData.restauranteNombre);
        formDataUpload.append('documento', documentoLegal);
        
        // Convertir sucursales a formato esperado por el backend
        const ubicaciones = formData.sucursales.map(sucursal => ({
          sucursal_Id: crypto.randomUUID(), // Generar ID temporal 
          comuna: sucursal.comuna
        }));
        
        formDataUpload.append('ubicaciones', JSON.stringify(ubicaciones));
        
        // Enviar ubicaciones adicionales (direcciones detalladas) 
        const direccionesDetalladas = formData.sucursales.map((s, index) => ({
          sucursal_Id: ubicaciones[index].sucursal_Id,
          direccion: s.direccion
        }));
        
        formDataUpload.append('direccionesDetalladas', JSON.stringify(direccionesDetalladas));
        
        try {
          const respuesta = await api.post('/restaurantes/verificacion/crear', formDataUpload, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${response.data.token}`
            }
          });
          console.log('Respuesta del servidor:', respuesta);
          
          // Añade esta línea para mostrar el mensaje de éxito y terminar la carga
          setSuccessMessage('Tu solicitud ha sido enviada con éxito. En breve recibirás un correo electrónico con la confirmación de la verificación de tus documentos.');
          setIsLoading(false);
          
        } catch (restauranteError) {
          console.error('Error completo:', restauranteError);
          console.error('Detalles del error:', restauranteError.response?.data || restauranteError.message);
          setError(restauranteError.response?.data?.message || 'Error al registrar el restaurante');
          setIsLoading(false);
        }
      } else {
        // Para Cliente y Repartidor
        const { token, user } = response.data;
        localStorage.setItem('token', token);

        // Actualizar estado de autenticación
        login(user, token);

        // Redireccionar según el rol
        if (user.rol === 'Repartidor') {
          navigate('/repartidor');
        } else {
          navigate('/cliente');
        }
      }
    } catch (error) {
      console.error('Error de registro:', error);

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

  // Renderizar mensaje de éxito (específico para administradores)
  if (successMessage) {
    return (
      <div className="register-container">
        <div className={`register-card ${animateForm ? 'animate-fade-in' : ''}`}>
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h2>¡Registro enviado!</h2>
            <p>{successMessage}</p>
            <button 
              type="button" 
              className="primary-button" 
              onClick={() => navigate('/')}
            >
              Volver a inicio
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
                </div>
              </div>
            </>
          )}

          {formStep === 3 && formData.rol === 'Admin' && (
            <>
              <div className="form-group">
                <h3 className="step-title">Datos del Restaurante</h3>
                
                <div className="admin-info-box">
                  <p>Deberá proporcionar información sobre su restaurante y adjuntar documentos legales para verificación.</p>
                </div>
                
                <div className="input-group">
                  <div className="input-container">
                    <span className="input-icon">🍽️</span>
                    <input 
                      type="text" 
                      name="restauranteNombre"
                      placeholder="Nombre del restaurante" 
                      value={formData.restauranteNombre} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>

                  <div className="sucursales-container">
                    <h4>Sucursales</h4>
                    <p>Debe registrar al menos una sucursal</p>
                    
                    <div className="sucursal-section">
                      {formData.sucursales.map((sucursal, index) => (
                        <div key={index} className="sucursal-item">
                          <div className="sucursal-header">
                            <h5>Sucursal {index + 1}</h5>
                            {index > 0 && (
                              <button 
                                type="button" 
                                className="remove-button"
                                onClick={() => removeSucursal(index)}
                              >
                                ❌
                              </button>
                            )}
                          </div>
                          
                          <div className="input-container">
                            <span className="input-icon">🏙️</span>
                            <input 
                              type="text" 
                              placeholder="Comuna" 
                              value={sucursal.comuna} 
                              onChange={(e) => handleSucursalChange(index, 'comuna', e.target.value)}
                              required 
                            />
                          </div>
                          
                          <div className="input-container">
                            <span className="input-icon">📍</span>
                            <input 
                              type="text" 
                              placeholder="Dirección detallada" 
                              value={sucursal.direccion} 
                              onChange={(e) => handleSucursalChange(index, 'direccion', e.target.value)}
                              required 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      type="button" 
                      className="add-sucursal-button"
                      onClick={addSucursal}
                    >
                      + Agregar otra sucursal
                    </button>
                  </div>

                  <div className="document-upload">
                    <h4>Documentos Legales</h4>
                    <p>Adjunte su licencia comercial y otros documentos legales (PDF, máx. 5MB)</p>
                    
                    <div className="file-upload-container">
                      <input 
                        type="file"
                        id="documento-legal"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="file-input"
                      />
                      <label htmlFor="documento-legal" className="file-label">
                        {documentoNombre ? documentoNombre : 'Seleccionar archivo'}
                      </label>
                    </div>
                    
                    <div className="document-info">
                      <p>Estos documentos serán verificados por nuestro equipo. Se le notificará por correo electrónico cuando su cuenta haya sido aprobada.</p>
                    </div>
                  </div>
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
                disabled={isLoading}
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
                ) : (formData.rol === 'Admin' ? 'Enviar Solicitud' : 'Registrarse')}
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