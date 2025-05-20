//
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import CloudinaryService from '../../services/CloudinaryService';
import { FaArrowLeft, FaCamera, FaPlus, FaTimes, FaStore } from 'react-icons/fa';
import './AddRestaurant.css';

export default function AddRestaurant() {
  const { id } = useParams(); // Para edición
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEditing = !!id;

  // Estado del formulario
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    image: null,
    imageUrl: '',
    categorias: ['General'],
    branches: [
      { nombre: '', direccion: '', comuna: '' }
    ]
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Si estamos en modo edición, cargar los datos del restaurante
  useEffect(() => {
    if (isEditing) {
      const fetchRestaurant = async () => {
        try {
          const res = await api.get(`/restaurantes/${id}`);
          const restaurant = res.data;
          
          // Obtener sucursales del restaurante
          let branches = [];
          try {
            const branchesRes = await api.get(`/restaurantes/${id}/ubicaciones`);
            if (branchesRes.data && branchesRes.data.ubicaciones) {
              branches = await Promise.all(
                branchesRes.data.ubicaciones.map(async (ub) => {
                  // Obtener detalles de la sucursal
                  try {
                    const sucRes = await api.get(`/sucursales/${ub.sucursal_Id}`);
                    return {
                      id: ub.sucursal_Id,
                      nombre: sucRes.data.nombre || '',
                      direccion: sucRes.data.direccion || '',
                      comuna: sucRes.data.comuna || ''
                    };
                  } catch (err) {
                    console.error("Error al obtener sucursal:", err);
                    return {
                      id: ub.sucursal_Id,
                      nombre: '',
                      direccion: '',
                      comuna: ub.comuna || ''
                    };
                  }
                })
              );
            }
          } catch (err) {
            console.error("Error al obtener ubicaciones:", err);
          }

          // Si no hay sucursales, crear una vacía
          if (branches.length === 0) {
            branches = [{ nombre: '', direccion: '', comuna: '' }];
          }

          setForm({
            nombre: restaurant.nombre || '',
            descripcion: restaurant.descripcion || '',
            image: null,
            imageUrl: restaurant.imageUrl || '',
            categorias: restaurant.categorias || ['General'],
            branches
          });

          // Si hay imagen, establecer la vista previa
          if (restaurant.imageUrl) {
            setPreview(restaurant.imageUrl);
          }
        } catch (err) {
          console.error("Error al cargar datos del restaurante:", err);
          setError('No se pudo cargar la información del restaurante');
        }
      };

      fetchRestaurant();
    }
  }, [id, isEditing]);

  // Manejar cambios en los campos del formulario
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Manejar cambio de imagen
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;

    setForm(prev => ({ ...prev, image: file }));

    // Crear URL para vista previa
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Eliminar imagen
  const removeImage = () => {
    setForm(prev => ({ ...prev, image: null, imageUrl: '' }));
    setPreview(null);
  };

  // Manejar cambios en sucursales
  const handleBranchChange = (index, e) => {
    const { name, value } = e.target;
    const updated = [...form.branches];
    updated[index] = { ...updated[index], [name]: value };
    setForm(prev => ({ ...prev, branches: updated }));
  };

  // Agregar nueva sucursal
  const addBranch = () => {
    setForm(prev => ({
      ...prev,
      branches: [...prev.branches, { nombre: '', direccion: '', comuna: '' }]
    }));
  };

  // Eliminar sucursal
  const removeBranch = index => {
    setForm(prev => {
      const updated = prev.branches.filter((_, i) => i !== index);
      return { ...prev, branches: updated.length ? updated : [{ nombre: '', direccion: '', comuna: '' }] };
    });
  };

  // Manejar envío del formulario
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validar datos mínimos
      if (!form.nombre.trim()) {
        throw new Error('El nombre del restaurante es obligatorio');
      }

      // Validar que al menos una sucursal tenga datos
      const validBranch = form.branches.some(branch => 
        branch.nombre.trim() && branch.direccion.trim() && branch.comuna.trim()
      );

      if (!validBranch) {
        throw new Error('Debe completar al menos una sucursal con nombre, dirección y comuna');
      }

      // 1) Subir imagen si existe
      let imageUrl = form.imageUrl;
      if (form.image) {
        imageUrl = await CloudinaryService.uploadProfileImage(form.image);
      }

      // 2) Preparar datos para el servidor
      const restaurantData = {
        nombre: form.nombre,
        descripcion: form.descripcion,
        imageUrl,
        categorias: form.categorias
      };

      let newRestId;

      // 3a) Si estamos editando, actualizar restaurante
      if (isEditing) {
        const updateRes = await api.put(`/restaurantes/editar/${id}`, restaurantData);
        newRestId = id;
        console.log("Restaurante actualizado:", updateRes.data);
      } 
      // 3b) Si es nuevo, crear restaurante
      else {
        const createRes = await api.post('/restaurantes/crear', restaurantData);
        newRestId = createRes.data.restaurante.id;
        console.log("Restaurante creado:", createRes.data);
      }

      // 4) Procesar sucursales
      await Promise.all(
        form.branches.map(async branch => {
          // Si la sucursal tiene ID, actualizarla
          if (branch.id) {
            return api.put(`/sucursales/${branch.id}`, {
              nombre: branch.nombre,
              direccion: branch.direccion,
              comuna: branch.comuna,
              restaurante_Id: newRestId
            });
          } 
          // Si no tiene ID y tiene datos, crearla
          else if (branch.nombre && branch.direccion && branch.comuna) {
            return api.post('/sucursales', {
              nombre: branch.nombre,
              direccion: branch.direccion,
              comuna: branch.comuna,
              restaurante_Id: newRestId
            });
          }
          return null;
        })
      );

      // 5) Mostrar éxito y redirigir
      setSuccess(isEditing 
        ? '¡Restaurante actualizado con éxito!' 
        : '¡Restaurante creado con éxito!');
      
      setTimeout(() => {
        navigate('/admin/restaurantes');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Error al procesar la solicitud'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-restaurant-container">
      <div className="form-header">
        <button 
          type="button" 
          className="back-button" 
          onClick={() => navigate('/admin/restaurantes')}
        >
          <FaArrowLeft />
        </button>
        <h2>{isEditing ? 'Editar Restaurante' : 'Crear Nuevo Restaurante'}</h2>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="restaurant-form">
        <div className="form-section">
          <h3>Información Básica</h3>
          
          {/* Imagen del restaurante */}
          <div className="image-upload-section">
            {preview ? (
              <div className="image-preview-container">
                <img src={preview} alt="Vista previa" className="image-preview" />
                <button 
                  type="button" 
                  className="remove-image-btn" 
                  onClick={removeImage}
                >
                  <FaTimes />
                </button>
              </div>
            ) : (
              <div className="image-upload-placeholder" onClick={() => document.getElementById('restaurantImage').click()}>
                <FaStore className="placeholder-icon" />
                <p>Haga clic para subir imagen (opcional)</p>
              </div>
            )}
            <input
              type="file"
              id="restaurantImage"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="nombre">Nombre del Restaurante*</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              placeholder="Ingrese el nombre del restaurante"
            />
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Describe tu restaurante"
              rows={4}
            ></textarea>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Sucursales</h3>
            <button
              type="button"
              className="add-branch-btn"
              onClick={addBranch}
            >
              <FaPlus /> Agregar Sucursal
            </button>
          </div>

          {form.branches.map((branch, idx) => (
            <div key={idx} className="branch-container">
              <div className="branch-header">
                <h4>Sucursal {idx + 1}</h4>
                {form.branches.length > 1 && (
                  <button
                    type="button"
                    className="remove-branch-btn"
                    onClick={() => removeBranch(idx)}
                  >
                    <FaTimes />
                  </button>
                )}
              </div>

              <div className="branch-fields">
                <div className="form-group">
                  <label htmlFor={`branchNombre-${idx}`}>Nombre de la Sucursal*</label>
                  <input
                    id={`branchNombre-${idx}`}
                    name="nombre"
                    type="text"
                    value={branch.nombre}
                    onChange={e => handleBranchChange(idx, e)}
                    placeholder="Ej. Sede Principal"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`direccion-${idx}`}>Dirección*</label>
                  <input
                    id={`direccion-${idx}`}
                    name="direccion"
                    type="text"
                    value={branch.direccion}
                    onChange={e => handleBranchChange(idx, e)}
                    placeholder="Ej. Calle 10 #43-12"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`comuna-${idx}`}>Comuna*</label>
                  <input
                    id={`comuna-${idx}`}
                    name="comuna"
                    type="text"
                    value={branch.comuna}
                    onChange={e => handleBranchChange(idx, e)}
                    placeholder="Ej. Comuna 14"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate('/admin/restaurantes')}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Procesando...' : isEditing ? 'Actualizar Restaurante' : 'Crear Restaurante'}
          </button>
        </div>
      </form>
    </div>
  );
}