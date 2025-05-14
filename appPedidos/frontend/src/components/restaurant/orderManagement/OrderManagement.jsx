// src/components/restaurant/MenuManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaImage, FaSave, FaTimes, FaSearch } from 'react-icons/fa';
import RestaurantService from '../../../services/RestaurantService';
import ProductService from '../../../services/ProductService';
import CloudinaryService from '../../../services/CloudinaryService';
import './OrderManagement.css';

const MenuManagement = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  
  // Estado para el restaurante
  const [restaurant, setRestaurant] = useState(null);
  
  // Estado para productos
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para edición de producto
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    nombre: '',
    precio: '',
    especificaciones: '',
    imageUrl: ''
  });
  
  // Estados adicionales
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (restaurantId) {
      loadRestaurantData();
      loadProducts();
    }
  }, [restaurantId]);

  // Filtrar productos al cambiar el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const loadRestaurantData = async () => {
    try {
      const response = await RestaurantService.getRestaurantById(restaurantId);
      
      if (response.success) {
        setRestaurant(response.data);
      } else {
        setError(response.message || 'Error al cargar datos del restaurante');
      }
    } catch (err) {
      console.error('Error al cargar restaurante:', err);
      setError('No se pudieron cargar los datos del restaurante');
    }
  };

  const loadProducts = async () => {
    try {
      setProductLoading(true);
      
      const response = await ProductService.getProductsByRestaurant(restaurantId);
      
      if (response.success) {
        setProducts(response.data || []);
        setFilteredProducts(response.data || []);
      } else {
        setError(response.message || 'Error al cargar productos');
      }
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setError('No se pudieron cargar los productos');
    } finally {
      setProductLoading(false);
      setLoading(false);
    }
  };

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Manejar cambios en el formulario de producto
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    
    // Si es campo de precio, solo permitir números
    if (name === 'precio') {
      const numericValue = value.replace(/\D/g, '');
      setProductForm(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setProductForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Abrir modal para crear nuevo producto
  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      nombre: '',
      precio: '',
      especificaciones: '',
      imageUrl: ''
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar producto
  const openEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      nombre: product.nombre,
      precio: product.precio.toString(),
      especificaciones: product.especificaciones,
      imageUrl: product.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  // Cerrar modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
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
      
      // Si estamos editando, actualizar imagen para un producto existente
      const uploadedUrl = editingProduct
        ? await CloudinaryService.uploadProductImage(file, editingProduct.id, restaurantId)
        : await CloudinaryService.uploadImage(file, `productos/${restaurantId}`);
      
      setProductForm(prev => ({
        ...prev,
        imageUrl: uploadedUrl
      }));
      
    } catch (err) {
      console.error('Error al subir imagen:', err);
      setError('Error al subir la imagen. Intenta nuevamente.');
    } finally {
      setIsImageUploading(false);
    }
  };

  // Enviar formulario de producto
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    
    if (!productForm.nombre || !productForm.precio) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }
    
    try {
      setProductLoading(true);
      setError(null);
      
      const productData = {
        ...productForm,
        restaurante_Id: restaurantId,
        precio: parseInt(productForm.precio)
      };
      
      let response;
      
      if (editingProduct) {
        // Actualizar producto existente
        response = await ProductService.updateProduct(editingProduct.id, productData);
      } else {
        // Crear nuevo producto
        response = await ProductService.createProduct(productData);
      }
      
      if (response.success) {
        setSuccess(editingProduct ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
        
        // Actualizar lista de productos
        await loadProducts();
        
        // Cerrar modal
        closeModal();
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(response.message || 'Error al guardar el producto');
      }
    } catch (err) {
      console.error('Error al guardar producto:', err);
      setError('Error al guardar el producto. Intenta nuevamente.');
    } finally {
      setProductLoading(false);
    }
  };

  // Manejar eliminación de producto
  const handleDeleteProduct = async (id) => {
    try {
      setProductLoading(true);
      
      const response = await ProductService.deleteProduct(id);
      
      if (response.success) {
        // Actualizar lista de productos
        setProducts(prevProducts => 
          prevProducts.filter(product => product.id !== id)
        );
        
        setSuccess('Producto eliminado correctamente');
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(response.message || 'Error al eliminar el producto');
      }
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      setError('Error al eliminar el producto. Intenta nuevamente.');
    } finally {
      setProductLoading(false);
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="menu-management-loading">
        <div className="spinner"></div>
        <p>Cargando datos del menú...</p>
      </div>
    );
  }

  return (
    <div className="menu-management">
      <div className="management-header">
        <div className="header-info">
          <h2>Gestión de Menú</h2>
          {restaurant && <p>Restaurante: {restaurant.nombre}</p>}
        </div>
        
        <button 
          className="create-button"
          onClick={openCreateModal}
        >
          <FaPlus /> Nuevo Producto
        </button>
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
      
      <div className="menu-controls">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {productLoading && !loading ? (
        <div className="menu-loading">
          <div className="spinner"></div>
          <p>Actualizando productos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="no-products">
          <p>No hay productos en este menú.</p>
          <button 
            className="create-product-button"
            onClick={openCreateModal}
          >
            Agregar Producto
          </button>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.nombre} />
                ) : (
                  <div className="image-placeholder">
                    <FaImage />
                  </div>
                )}
              </div>
              
              <div className="product-info">
                <h3>{product.nombre}</h3>
                <p className="product-price">{formatPrice(product.precio)}</p>
                
                {product.especificaciones && (
                  <p className="product-description">{product.especificaciones}</p>
                )}
              </div>
              
              <div className="product-actions">
                <button 
                  className="edit-button"
                  onClick={() => openEditModal(product)}
                  title="Editar Producto"
                >
                  <FaEdit />
                </button>
                
                <button 
                  className="delete-button"
                  onClick={() => setConfirmDelete(product.id)}
                  title="Eliminar Producto"
                >
                  <FaTrash />
                </button>
              </div>
              
              {confirmDelete === product.id && (
                <div className="confirm-delete">
                  <p>¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.</p>
                  
                  <div className="confirm-actions">
                    <button 
                      className="cancel-button"
                      onClick={() => setConfirmDelete(null)}
                    >
                      Cancelar
                    </button>
                    
                    <button 
                      className="confirm-button"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Modal para crear/editar producto */}
      {isModalOpen && (
        <div className="product-modal-overlay">
          <div className="product-modal">
            <div className="modal-header">
              <h3>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button className="close-modal-button" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmitProduct} className="product-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre del Producto*</label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={productForm.nombre}
                  onChange={handleProductChange}
                  placeholder="Ej: Hamburguesa Especial"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="precio">Precio*</label>
                <input
                  type="text"
                  id="precio"
                  name="precio"
                  value={productForm.precio}
                  onChange={handleProductChange}
                  placeholder="Ej: 15000"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="especificaciones">Descripción</label>
                <textarea
                  id="especificaciones"
                  name="especificaciones"
                  value={productForm.especificaciones}
                  onChange={handleProductChange}
                  placeholder="Describe tu producto..."
                  rows={4}
                />
              </div>
              
              <div className="image-upload-section">
                <h4>Imagen del Producto</h4>
                
                <div 
                  className={`image-upload-container ${isImageUploading ? 'uploading' : ''}`}
                  onClick={handleImageClick}
                >
                  {productForm.imageUrl ? (
                    <img 
                      src={productForm.imageUrl} 
                      alt="Vista previa" 
                      className="product-image-preview"
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
              
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                  disabled={productLoading}
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  className="save-button"
                  disabled={productLoading}
                >
                  {productLoading ? (
                    <>
                      <span className="spinner-small"></span>
                      {editingProduct ? 'Actualizando...' : 'Creando...'}
                    </>
                  ) : (
                    <>
                      <FaSave />
                      {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;