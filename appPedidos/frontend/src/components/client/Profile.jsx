import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaTrash, FaCheck } from 'react-icons/fa';
import ProfileService from '../../services/ProfileService';
import NotificationManager from '../shared/Notification';
import '../../styles/Profile.css';

function Profile() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
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
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  
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
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    setPasswordError('');
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    try {
      setIsLoading(true);
      
      await ProfileService.changePassword(passwordData.newPassword);
      
      setPasswordData({
        newPassword: '',
        confirmPassword: ''
      });
      
      setShowPasswordForm(false);
      
      setSuccessMessage('¡Contraseña actualizada exitosamente! Tu cuenta ahora está protegida con la nueva contraseña.');
      window.showNotification('Contraseña actualizada exitosamente', 'success');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setPasswordError(error.response.data.message);
        window.showNotification(error.response.data.message, 'error');
      } else {
        setPasswordError('Error al cambiar contraseña. Intente nuevamente.');
        window.showNotification('Error al cambiar contraseña. Intente nuevamente.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMostrarConfirmacionEliminacion = () => {
    setDeleteConfirmation('');
    setDeleteError('');
    setShowDeleteModal(true);
  };
  
  const handleCerrarModalEliminacion = () => {
    setShowDeleteModal(false);
    setDeleteConfirmation('');
    setDeleteError('');
    setDeletingAccount(false);
  };
  
  const handleEliminarCuenta = async () => {
    setDeleteError('');
    
    if (deleteConfirmation.toLowerCase() !== 'eliminar') {
      setDeleteError('Debes escribir "eliminar" para confirmar');
      return;
    }
    
    try {
      setDeletingAccount(true);
      
      await ProfileService.eliminarCuenta();
      
      window.showNotification('Tu cuenta ha sido eliminada exitosamente. Redirigiendo...', 'success');
      
      setShowDeleteModal(false);
      
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setDeleteError(error.response.data.message);
        window.showNotification(error.response.data.message, 'error');
      } else {
        setDeleteError('Error al eliminar la cuenta. Intente nuevamente.');
        window.showNotification('Error al eliminar la cuenta. Intente nuevamente.', 'error');
      }
    } finally {
      setDeletingAccount(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const dataToSend = {
        ...formData,
        telefono: parseInt(formData.telefono),
        comuna: parseInt(formData.comuna)
      };
      
      const updatedProfile = await ProfileService.updateUserProfile(dataToSend);
      
      setProfile(updatedProfile);
      login(updatedProfile);
      
      setSuccessMessage('Perfil actualizado correctamente');
      window.showNotification('Perfil actualizado correctamente', 'success');
      setIsEditing(false);
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      setError('Error al actualizar el perfil. Intente nuevamente.');
      window.showNotification('Error al actualizar el perfil. Intente nuevamente.', 'error');
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
      
      setProfile(prev => ({
        ...prev,
        imageUrl
      }));
      
      login({
        ...user,
        imageUrl
      });
      
      setSuccessMessage('Imagen de perfil actualizada correctamente');
      window.showNotification('Imagen de perfil actualizada correctamente', 'success');
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      setError('Error al subir la imagen. Intente nuevamente.');
      window.showNotification('Error al subir la imagen. Intente nuevamente.', 'error');
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
      <NotificationManager />
      
      <div className="profile-header">
        <h2>Mi Perfil</h2>
        <p className="subtitle">Gestiona tu información personal y preferencias</p>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
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
                
                <button
                  className="password-button"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                  Cambiar contraseña
                </button>
                
                <button
                  className="delete-button"
                  onClick={handleMostrarConfirmacionEliminacion}
                >
                  <FaTrash /> Eliminar cuenta
                </button>
              </div>
              
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

      {showDeleteModal && (
        <div className='confirmation-modal-overlay'>
          <div className='confirmation-modal delete-modal'>
            <h2>⚠️ Eliminar cuenta permanentemente</h2>

            <div className='modal-user-info'>
              <p><strong>Usuario:</strong> {profile?.nombreCompleto}</p>
              <p><strong>Email:</strong> {profile?.email}</p>
              <p><strong>Rol:</strong> {profile?.rol}</p>
            </div>

            <div className="delete-warning-modal">
              <FaExclamationTriangle className="warning-icon" />
              <div className="warning-content">
                <p><strong>¡Atención!</strong> Esta acción es irreversible.</p>
                {profile?.rol === 'Admin' && (
                  <p><strong>Como administrador:</strong> Se eliminarán también todos tus restaurantes y productos asociados.</p>
                )}
                <p>Para confirmar, escribe <strong>"eliminar"</strong> en el campo de abajo:</p>
              </div>
            </div>

            <div className="form-group">
              <label>Confirmar eliminación</label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Escribe 'eliminar' para confirmar"
                className={deleteError ? 'input-error' : ''}
              />
            </div>
            
            {deleteError && (
              <div className="error-message">
                <FaExclamationTriangle />
                <p>{deleteError}</p>
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={handleCerrarModalEliminacion}
                disabled={deletingAccount}
              >
                Cancelar
              </button>
              <button 
                className="delete-confirm-btn" 
                onClick={handleEliminarCuenta}
                disabled={deletingAccount}
              >
                {deletingAccount ? (
                  <>
                    <div className="btn-spinner small"></div>
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <FaTrash />
                    <span>Eliminar definitivamente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;