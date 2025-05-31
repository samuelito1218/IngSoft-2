import React, { useState, useEffect } from 'react';
import { FaTimes, FaCamera, FaUtensils, FaStore, FaChevronDown, FaCheck  } from 'react-icons/fa';
import CloudinaryService from '../../../services/CloudinaryService';
import { api } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import './ProductForm.css';

const ProductForm = ({ product, isEditing, onSave, onCancel, restauranteId }) => {
  const { token } = useAuth();
  
  const [form, setForm] = useState({
    nombre: '',
    especificaciones: '',
    precio: '',
    image: null,
    imageUrl: '',
    categoria: '',
    sucursales_Ids: [],
    todasLasSucursales: false
  });
  
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [sucursales, setSucursales] = useState([]);
  const [loadingSucursales, setLoadingSucursales] = useState(true);
  const [showSucursalDropdown, setShowSucursalDropdown] = useState(false);

  const categorias = ['Hamburguesa', 'Pizza', 'Sushi', 'Ensaladas', 'Perro', 'Picadas', 'Postres', 'Otras'];

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        setLoadingSucursales(true);
        const response = await api.get(`/restaurantes/${restauranteId}/sucursales`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSucursales(response.data || []);
        setLoadingSucursales(false);
      } catch (error) {
        console.error("Error al cargar sucursales:", error);
        setError("No se pudieron cargar las sucursales. Por favor, intente de nuevo.");
        setLoadingSucursales(false);
      }
    };
    
    fetchSucursales();
  }, [restauranteId, token]);

  useEffect(() => {
    if (isEditing && product) {

      const todasSeleccionadas = 
        sucursales.length > 0 && 
        product.sucursales_Ids && 
        sucursales.every(s => product.sucursales_Ids.includes(s.id));
      
      setForm({
        nombre: product.nombre || '',
        especificaciones: product.especificaciones || '',
        precio: product.precio ? String(product.precio) : '',
        image: null,
        imageUrl: product.imageUrl || '',
        categoria: product.categoria || 'Otras',
        sucursales_Ids: product.sucursales_Ids || [],
        todasLasSucursales: todasSeleccionadas
      });
      
      if (product.imageUrl) {
        setPreview(product.imageUrl);
      }
    }
  }, [isEditing, product, sucursales]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'todasLasSucursales') {
        setForm(prev => ({
          ...prev,
          todasLasSucursales: checked,
          sucursales_Ids: checked ? [] : prev.sucursales_Ids
        }));
      } else if (name.startsWith('sucursal-')) {
        const sucursalId = name.replace('sucursal-', '');
        let nuevasSucursales = [...form.sucursales_Ids];
        
        if (checked) {
          nuevasSucursales.push(sucursalId);
        } else {
          nuevasSucursales = nuevasSucursales.filter(id => id !== sucursalId);
        }
        
        setForm(prev => ({
          ...prev,
          sucursales_Ids: nuevasSucursales,
          todasLasSucursales: false
        }));
      }
    } else if (name === 'precio') {
      if (value === '' || /^[0-9]*(\.[0-9]{0,2})?$/.test(value)) {
        setForm(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setForm(prev => ({ ...prev, image: file }));

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    try {
      setUploadingImage(true);
      const imageUrl = await CloudinaryService.uploadImage(file, 'productos');
      setForm(prev => ({ ...prev, imageUrl }));
      setUploadingImage(false);
    } catch (error) {
      console.error("Error al subir imagen:", error);
      setUploadingImage(false);
    }
  };

  // Eliminar imagen
  const removeImage = () => {
    setForm(prev => ({ ...prev, image: null, imageUrl: '' }));
    setPreview(null);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {

      if (!form.nombre.trim()) {
        throw new Error('El nombre del producto es obligatorio');
      }

      if (!form.precio || parseFloat(form.precio) <= 0) {
        throw new Error('El precio debe ser un valor válido mayor a cero');
      }
 
      if (!form.especificaciones.trim()) {
        throw new Error('La descripción del producto es obligatoria');
      }

      if (!form.categoria || form.categoria.trim() === '') {
        throw new Error('La categoría es obligatoria');
      }

      if (!form.todasLasSucursales && form.sucursales_Ids.length === 0) {
        throw new Error('Debe seleccionar al menos una sucursal');
      }

      let imagenFinal = form.imageUrl;
      if (form.image && !form.imageUrl) {
        try {
          setUploadingImage(true);
          imagenFinal = await CloudinaryService.uploadImage(form.image, 'productos');
          setUploadingImage(false);
        } catch (error) {
          console.error("Error al subir imagen:", error);
          setUploadingImage(false);
        }
      }

      const productData = {
        nombre: form.nombre.trim(),
        especificaciones: form.especificaciones.trim(), 
        precio: parseFloat(form.precio), 
        imageUrl: imagenFinal || null,
        categoria: form.categoria.trim(), 
        restaurante_Id: restauranteId,
        sucursalesIds: form.sucursales_Ids,
        todasLasSucursales: form.todasLasSucursales
      };

      console.log("Datos que se envían al backend:", productData);
 
      await onSave(productData);
      
      setLoading(false);
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showSucursalDropdown && 
        !event.target.closest('.sucursal-dropdown-container')
      ) {
        setShowSucursalDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSucursalDropdown]);

  return (
    <div className="product-form-container">
      <div className="form-header">
        <h3>{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
        <button 
          className="close-button" 
          onClick={onCancel}
          type="button"
        >
          <FaTimes />
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>

        <div className="image-upload-section">
          {preview ? (
            <div className="image-preview-container">
              {uploadingImage && <div className="uploading-overlay">Subiendo...</div>}
              <img src={preview} alt="Vista previa" className="image-preview" />
              <button 
                type="button" 
                className="remove-image-btn" 
                onClick={removeImage}
                disabled={uploadingImage}
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <div className="image-upload-placeholder" onClick={() => document.getElementById('productImage').click()}>
              <FaUtensils className="placeholder-icon" />
              <p>Haga clic para subir imagen (opcional)</p>
            </div>
          )}
          <input
            type="file"
            id="productImage"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={uploadingImage}
          />
        </div>

        <div className="form-group">
          <label htmlFor="nombre">Nombre del Producto*</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
            placeholder="Ingrese el nombre del producto"
          />
        </div>

        <div className="form-group">
          <label htmlFor="especificaciones">Descripción*</label>
          <textarea
            id="especificaciones"
            name="especificaciones"
            value={form.especificaciones}
            onChange={handleChange}
            required
            placeholder="Describa el producto (obligatorio)"
            rows={3}
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="precio">Precio*</label>
          <div className="price-input-container">
            <span className="currency-symbol">$</span>
            <input
              type="text"
              id="precio"
              name="precio"
              value={form.precio}
              onChange={handleChange}
              required
              placeholder="0"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="categoria">Categoría*</label>
          <div className="custom-select-container">
            <select
              id="categoria"
              name="categoria"
              value={form.categoria}
              onChange={handleChange}
              required
              className="custom-select"
            >
              <option value="">Seleccionar categoría</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <FaChevronDown className="select-arrow" />
          </div>
        </div>
        
        <div className="form-group">
          <label>Disponibilidad en Sucursales*</label>
          
          {loadingSucursales ? (
            <div className="loading-spinner">Cargando sucursales...</div>
          ) : sucursales.length === 0 ? (
            <div className="no-sucursales-message">
              No hay sucursales disponibles. Cree una sucursal primero.
            </div>
          ) : (
            <div className={`sucursal-dropdown-container ${showSucursalDropdown ? 'open' : ''}`}>
              <div 
                className="sucursal-dropdown-header"
                onClick={() => setShowSucursalDropdown(!showSucursalDropdown)}
              >
                {form.todasLasSucursales ? 'Todas las sucursales' : 
                  form.sucursales_Ids.length > 0 ? 
                  `${form.sucursales_Ids.length} sucursal(es) seleccionada(s)` : 
                  'Seleccionar sucursales'}
                <FaChevronDown className="dropdown-arrow" />
              </div>
              
              {showSucursalDropdown && (
                <div className="sucursal-dropdown-menu">
                  <div 
                    className={`sucursal-option ${form.todasLasSucursales ? 'selected' : ''}`}
                    onClick={() => {
                      setForm(prev => ({
                        ...prev,
                        todasLasSucursales: !prev.todasLasSucursales,
                        sucursales_Ids: []
                      }));
                    }}
                  >
                    <div className="option-content">
                      Todas las sucursales
                    </div>
                    {form.todasLasSucursales && (
                      <div className="selected-indicator">✓</div>
                    )}
                  </div>
                  
                  {!form.todasLasSucursales && (
                    sucursales.map(sucursal => {
                      const isSelected = form.sucursales_Ids.includes(sucursal.id);
                      return (
                        <div 
                          key={sucursal.id} 
                          className={`sucursal-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            const id = sucursal.id;
                            let nuevasSucursales = [...form.sucursales_Ids];
                            
                            if (nuevasSucursales.includes(id)) {
                              nuevasSucursales = nuevasSucursales.filter(i => i !== id);
                            } else {
                              nuevasSucursales.push(id);
                            }
                            
                            setForm(prev => ({
                              ...prev,
                              sucursales_Ids: nuevasSucursales,
                              todasLasSucursales: false
                            }));
                          }}
                        >
                          <div className="option-content">
                            {sucursal.nombre} - {sucursal.direccion}, {sucursal.comuna}
                          </div>
                          {isSelected && (
                            <div className="selected-indicator">✓</div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
            disabled={loading || uploadingImage}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="save-button"
            disabled={loading || uploadingImage || loadingSucursales || (sucursales.length === 0)}
          >
            {loading || uploadingImage ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;