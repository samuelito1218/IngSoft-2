import React, { useState, useEffect } from 'react';
import { FaTimes, FaCamera, FaUtensils } from 'react-icons/fa';
import CloudinaryService from '../../../services/CloudinaryService';
import './ProductForm.css';

const ProductForm = ({ product, isEditing, onSave, onCancel, restauranteId }) => {
  const [form, setForm] = useState({
    nombre: '',
    especificaciones: '',
    precio: '',
    imagen: null,
    imagenUrl: '',
  });
  
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Si estamos editando, cargar datos del producto
  useEffect(() => {
    if (isEditing && product) {
      setForm({
        nombre: product.nombre || '',
        especificaciones: product.especificaciones || '',
        precio: product.precio || '',
        imagen: null,
        imagenUrl: product.imagen || '',
      });
      
      if (product.imagen) {
        setPreview(product.imagen);
      }
    }
  }, [isEditing, product]);

  // Manejar cambios en los campos del formulario
  const handleChange = e => {
    const { name, value } = e.target;
    
    // Para precio, solo permitir números y una coma/punto
    if (name === 'precio') {
      const regex = /^[0-9]*(\.[0-9]{0,2})?$/;
      if (value === '' || regex.test(value)) {
        setForm(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Manejar cambio de imagen
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;

    setForm(prev => ({ ...prev, imagen: file }));

    // Crear URL para vista previa
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Eliminar imagen
  const removeImage = () => {
    setForm(prev => ({ ...prev, imagen: null, imagenUrl: '' }));
    setPreview(null);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validar campos requeridos
      if (!form.nombre.trim()) {
        throw new Error('El nombre del producto es obligatorio');
      }

      if (!form.precio || parseFloat(form.precio) <= 0) {
        throw new Error('El precio debe ser un valor válido mayor a cero');
      }

      // Subir imagen si se seleccionó una nueva
      let imagenFinal = form.imagenUrl;
      if (form.imagen) {
        imagenFinal = await CloudinaryService.uploadProfileImage(form.imagen);
      }

      // Crear objeto con datos del producto
      const productData = {
        nombre: form.nombre.trim(),
        especificaciones: form.especificaciones.trim(),
        precio: parseInt(parseFloat(form.precio) * 100) / 100, // Convertir a número con 2 decimales
        imagen: imagenFinal,
        restaurante_Id: restauranteId
      };

      // Guardar el producto
      onSave(productData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

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
        {/* Imagen del producto */}
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
          <label htmlFor="especificaciones">Descripción</label>
          <textarea
            id="especificaciones"
            name="especificaciones"
            value={form.especificaciones}
            onChange={handleChange}
            placeholder="Describa el producto"
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

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="save-button"
            disabled={loading}
          >
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;