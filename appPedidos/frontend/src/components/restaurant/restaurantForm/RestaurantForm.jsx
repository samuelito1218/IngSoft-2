import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaTrash, FaImage, FaMapMarkerAlt } from 'react-icons/fa';
import RestaurantService from '../../../services/RestaurantService';
import CloudinaryService from '../../../services/CloudinaryService';
import './RestaurantForm.css';

const RestaurantForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  
  // Estado para el restaurante
  const [restaurant, setRestaurant] = useState({
    nombre: '',
    ubicaciones: []
  });
  
  // Estados adicionales
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isImageUploading, setIsImageUploading] = useState(false);
  
  // Estado para nueva ubicación
  const [newLocation, setNewLocation] = useState({
    sucursal_Id: '',
    comuna: ''
  });

  // Cargar datos si estamos en modo edición
  useEffect(() => {
    if (id) {
      loadRestaurantData();
    }
  }, [id]);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await RestaurantService.getRestaurantById(id);
      
      if (response.success) {
        setRestaurant(response.data);
        
        if (response.data.imageUrl) {
          setImageUrl(response.data.imageUrl);
        }
      } else {
        setError(response.message || 'Error al cargar datos del restaurante');
      }
    } catch (err) {
      console.error('Error al cargar restaurante:', err);
      setError('No se pudieron cargar los datos del restaurante');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario principal
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRestaurant(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en el formulario de nueva ubicación
  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    setNewLocation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Agregar nueva ubicación
  const addLocation = () => {
    if (!newLocation.sucursal_Id || !newLocation.comuna) {
      setError('Por favor completa todos los campos de la ubicación');
      return;
    }
    
    setRestaurant(prev => ({
      ...prev,
      ubicaciones: [...prev.ubicaciones, { ...newLocation }]
    }));
    
    // Limpiar formulario de nueva ubicación
    setNewLocation({
      sucursal_Id: '',
      comuna: ''
    });
  };

  // Eliminar ubicación
  const removeLocation = (index) => {
    setRestaurant(prev => ({
      ...prev,
      ubicaciones: prev.ubicaciones.filter((_, i) => i !== index)
    }));
  };

  // Manejar clic en selector de imagen
  const handleImageClick = () => {
    imageInputRef.current.click();
  };

  // Manejar cambio de imagen
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setIsImageUploading(true);
      setError(null);
      
      // Si tenemos ID, actualizamos imagen para un restaurante existente
      const uploadedUrl = id
        ? await CloudinaryService.uploadRestaurantImage(file, id)
        : await CloudinaryService.uploadImage(file, 'restaurantes');
      
      setImageUrl(uploadedUrl);
      setSuccess('Imagen subida correctamente');
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error al subir imagen:', err);
      setError('Error al subir la imagen. Intenta nuevamente.');
    } finally {
      setIsImageUploading(false);
    }
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!restaurant.nombre || restaurant.ubicaciones.length === 0) {
      setError('Por favor completa todos los campos obligatorios y agrega al menos una ubicación');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const restaurantData = {
        ...restaurant,
        imageUrl // Incluir URL de imagen si existe
      };
      
      let response;
      
      if (id) {
        // Actualizar restaurante existente
        response = await RestaurantService.updateRestaurant(id, restaurantData);
      } else {
        // Crear nuevo restaurante
        response = await RestaurantService.createRestaurant(restaurantData);
      }
      
      if (response.success) {
        setSuccess(id ? 'Restaurante actualizado correctamente' : 'Restaurante creado correctamente');
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate('/restaurante/mis-restaurantes');
        }, 2000);
      } else {
        setError(response.message || 'Error al guardar el restaurante');
      }
    } catch (err) {
      console.error('Error al guardar restaurante:', err);
      setError('Error al guardar el restaurante. Intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="restaurant-form-loading">
        <div className="spinner"></div>
        <p>Cargando datos del restaurante...</p>
      </div>
    );
  }

  return (
    <div className="restaurant-form-container">
      <div className="form-header">
        <h2>{id ? 'Editar Restaurante' : 'Crear Nuevo Restaurante'}</h2>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <p>{success}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="restaurant-form">
        <div className="form-main">
          <div className="form-section">
            <h3>Información General</h3>
            
            <div className="form-group">
              <label htmlFor="nombre">Nombre del Restaurante*</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={restaurant.nombre}
                onChange={handleChange}
                placeholder="Ej: Restaurante El Sabor"
                required
              />
            </div>
            
            <div className="image-upload-section">
              <h4>Imagen del Restaurante</h4>
              
              <div 
                className={`image-upload-container ${isImageUploading ? 'uploading' : ''}`}
                onClick={handleImageClick}
              >
                {imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt="Imagen del restaurante" 
                    className="restaurant-image"
                  />
                ) : (
                  <div className="image-placeholder">
                    <FaImage />
                    <p>Haz clic para subir imagen</p>
                  </div>
                )}
                
                {isImageUploading && (
                  <div className="image-loading-overlay">
                    <div className="spinner"></div>
                  </div>
                )}
              </div>
              
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Ubicaciones</h3>
            
            <div className="locations-list">
              {restaurant.ubicaciones.length === 0 ? (
                <div className="no-locations">
                  <p>No hay ubicaciones agregadas</p>
                </div>
              ) : (
                restaurant.ubicaciones.map((location, index) => (
                  <div key={index} className="location-item">
                    <div className="location-icon">
                      <FaMapMarkerAlt />
                    </div>
                    
                    <div className="location-details">
                      <p className="location-id"><strong>ID:</strong> {location.sucursal_Id}</p>
                      <p className="location-comuna"><strong>Comuna:</strong> {location.comuna}</p>
                    </div>
                    
                    <button 
                      type="button"
                      className="remove-location-button"
                      onClick={() => removeLocation(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="add-location-form">
              <h4>Agregar Nueva Ubicación</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sucursal_Id">ID de Sucursal*</label>
                  <input
                    type="text"
                    id="sucursal_Id"
                    name="sucursal_Id"
                    value={newLocation.sucursal_Id}
                    onChange={handleLocationChange}
                    placeholder="Ej: SUC001"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="comuna">Comuna*</label>
                  <input
                    type="text"
                    id="comuna"
                    name="comuna"
                    value={newLocation.comuna}
                    onChange={handleLocationChange}
                    placeholder="Ej: Cali Norte"
                  />
                </div>
                
                <button 
                  type="button"
                  className="add-location-button"
                  onClick={addLocation}
                >
                  <FaPlus /> Agregar
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate('/restaurante/mis-restaurantes')}
            disabled={submitting}
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            className="save-button"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-small"></span>
                {id ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              id ? 'Actualizar Restaurante' : 'Crear Restaurante'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RestaurantForm;