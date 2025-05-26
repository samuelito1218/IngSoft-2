// src/components/client/ProfileComponent.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ProfileService from '../../services/ProfileService';
import '../../styles/Profile.css';

function Profile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    telefono: '',
    direccion: '',
    comuna: '',
  });
  
  // Estado para cambio de contraseña
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  
  const [uploadingImage, setUploadingImage] = useState(false);
  
  useEffect(() => {
    loadUserProfile();
  }, []);
  
  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userData = await ProfileService.getUserProfile();
      setProfile(userData);
      
      // Inicializar formulario con datos actuales
      // Si userData.historialDirecciones existe y tiene elementos, usar la comuna del último
      const lastDireccion = userData.historialDirecciones && 
                         userData.historialDirecciones.length > 0 ? 
                         userData.historialDirecciones[userData.historialDirecciones.length - 1] : null;
      setFormData({
        nombreCompleto: userData.nombreCompleto || '',
        telefono: userData.telefono || '',
        direccion: userData.direccion || '',
        comuna: lastDireccion ? lastDireccion.comuna : '',
        cedula: userData.cedula || '',
      });
      
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      setError('No se pudo cargar la información del perfil');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Método para manejar cambios en el formulario de contraseña
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Método para manejar el envío del formulario de contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Restablecer mensajes de error
    setPasswordError('');
    
    // Validar que las contraseñas coincidan
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    
    // Validar longitud mínima de contraseña
    if (passwordData.newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Llamar al servicio con la nueva contraseña
      await ProfileService.changePassword(passwordData.newPassword);
      
      // Limpiar formulario
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      });
      
      // Cerrar formulario de contraseña
      setShowPasswordForm(false);
      
      // Mostrar mensaje de éxito más destacado
      setSuccessMessage('¡Contraseña actualizada exitosamente! Tu cuenta ahora está protegida con la nueva contraseña.');
      
      // Limpiar mensaje después de 5 segundos (tiempo aumentado para mejor visibilidad)
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setPasswordError(error.response.data.message);
      } else {
        setPasswordError('Error al cambiar contraseña. Intente nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Convertir campos numéricos
      const dataToSend = {
        ...formData,
        telefono: parseInt(formData.telefono),
        comuna: parseInt(formData.comuna)
      };
      
      const updatedProfile = await ProfileService.updateUserProfile(dataToSend);
      
      // Actualizar estado local y contexto de autenticación
      setProfile(updatedProfile);
      login(updatedProfile); // Actualizar datos de usuario en el contexto
      
      setSuccessMessage('Perfil actualizado correctamente');
      setIsEditing(false);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setError('Error al actualizar el perfil. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImageClick = () => {
    fileInputRef.current.click();
  };
  
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploadingImage(true);
      setError(null);
      
      const imageUrl = await ProfileService.uploadProfileImage(user.id, file);
      
      // Actualizar imagen en el perfil local
      setProfile(prev => ({
        ...prev,
        imageUrl
      }));
      
      // Actualizar imagen en el contexto de autenticación
      login({
        ...user,
        imageUrl
      });
      
      setSuccessMessage('Imagen de perfil actualizada correctamente');
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Error al subir imagen:', error);
      setError('Error al subir la imagen. Intente nuevamente.');
    } finally {
      setUploadingImage(false);
    }
  };
  
  if (isLoading && !profile) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }
  
  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>Mi Perfil</h2>
        <p className="subtitle">Gestiona tu información personal y preferencias</p>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {/* Mensaje de éxito mejorado con ícono */}
      {successMessage && (
        <div className="success-message animated-success">
          <div className="success-icon">✓</div>
          <div className="success-content">{successMessage}</div>
        </div>
      )}
      
      <div className="profile-content">
        <div className="profile-image-section">
          <div
            className={`profile-image-container ${uploadingImage ? 'uploading' : ''}`}
            onClick={handleImageClick}
          >
            {profile?.imageUrl ? (
              <img
                src={profile.imageUrl}
                alt="Foto de perfil"
                className="profile-image"
              />
            ) : (
              <div className="profile-image-placeholder">
                {profile?.nombreCompleto?.charAt(0).toUpperCase() || user?.nombreCompleto?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            
            {uploadingImage && (
              <div className="image-loading-overlay">
                <div className="spinner small"></div>
              </div>
            )}
            
            <div className="image-overlay">
              <span>Cambiar foto</span>
            </div>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          
          <div className="profile-user-info">
            <h3>{profile?.nombreCompleto || user?.nombreCompleto}</h3>
            <p>{profile?.email || user?.email}</p>
            <span className="user-role">{profile?.rol || user?.rol}</span>
          </div>
        </div>
        
        <div className="profile-details">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  name="nombreCompleto"
                  value={formData.nombreCompleto}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="number"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Comuna</label>
                <input
                  type="number"
                  name="comuna"
                  value={formData.comuna}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setIsEditing(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  className="save-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-small"></span>
                      Guardando...
                    </>
                  ) : 'Guardar cambios'}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-group">
                <h4>Información personal</h4>
                
                <div className="info-row">
                  <span className="info-label">Nombre:</span>
                  <span className="info-value">{profile?.nombreCompleto}</span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{profile?.email}</span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Teléfono:</span>
                  <span className="info-value">{profile?.telefono}</span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Cédula:</span>
                  <span className="info-value">{profile?.cedula}</span>
                </div>
              </div>
              
              <div className="info-group">
                <h4>Dirección</h4>
                
                <div className="info-row">
                  <span className="info-label">Dirección:</span>
                  <span className="info-value">{profile?.direccion}</span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Comuna:</span>
                  <span className="info-value">
                    {profile?.historialDirecciones && profile.historialDirecciones.length > 0 
                      ? profile.historialDirecciones[profile.historialDirecciones.length - 1].comuna 
                      : 'No especificada'}
                  </span>
                </div>
              </div>
              
              <div className="edit-button-container">
                <button
                  className="edit-button"
                  onClick={() => setIsEditing(true)}
                >
                  Editar perfil
                </button>
                
                {/* Botón para cambiar contraseña */}
                <button
                  className="password-button"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  Cambiar contraseña
                </button>
              </div>
              
              {/* Formulario para cambiar contraseña */}
              {showPasswordForm && (
                <div className="password-form-container">
                  <h4>Cambiar contraseña</h4>
                  
                  {passwordError && (
                    <div className="password-error">{passwordError}</div>
                  )}
                  
                  <form onSubmit={handleChangePassword} className="password-form">
                    <div className="form-group">
                      <label>Nueva contraseña</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Confirmar nueva contraseña</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    
                    <div className="form-actions">
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={() => setShowPasswordForm(false)}
                        disabled={isLoading}
                      >
                        Cancelar
                      </button>
                      
                      <button
                        type="submit"
                        className="save-button"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-small"></span>
                            Guardando...
                          </>
                        ) : 'Actualizar contraseña'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;