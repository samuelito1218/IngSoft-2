
// src/components/admin/productos/ProductManagement.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { api } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import ProductForm from './ProductForm';
import './ProductManagement.css';

export default function ProductManagement() {
  const { restauranteId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el modal de producto
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado para el modal de confirmación de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener información del restaurante
        const restaurantRes = await api.get(`/restaurantes/${restauranteId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRestaurant(restaurantRes.data);
        
        // Obtener productos del restaurante
        const productsRes = await api.get(`/restaurantes/${restauranteId}/productos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setProducts(productsRes.data || []);
        setFilteredProducts(productsRes.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError('No se pudieron cargar los datos. Por favor, intente de nuevo.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [restauranteId, token]);

  // Filtrar productos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.especificaciones.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Manejar cambio en el campo de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Abrir modal para agregar nuevo producto
  const handleAddProduct = () => {
    setCurrentProduct(null);
    setIsEditing(false);
    setShowProductModal(true);
  };

  // Abrir modal para editar producto
  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setIsEditing(true);
    setShowProductModal(true);
  };

  // Confirmar eliminación de producto
  const confirmDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // Eliminar producto
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      await api.delete(`/productos/${productToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Actualizar lista de productos
      setProducts(prevProducts => 
        prevProducts.filter(p => p.id !== productToDelete.id)
      );
      
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      console.error("Error al eliminar producto:", err);
      setError('No se pudo eliminar el producto. Por favor, intente de nuevo.');
    }
  };

  // Guardar producto (nuevo o editado)
  const handleSaveProduct = async (productData) => {
    try {
      let savedProduct;
      
      if (isEditing && currentProduct) {
        // Actualizar producto existente
        const res = await api.put(`/productos/${currentProduct.id}`, productData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        savedProduct = res.data.producto;
        
        // Actualizar en la lista
        setProducts(prevProducts => 
          prevProducts.map(p => p.id === savedProduct.id ? savedProduct : p)
        );
      } else {
        // Crear nuevo producto
        const res = await api.post('/productos', {
          ...productData,
          restaurante_Id: restauranteId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        savedProduct = res.data.producto;
        
        // Agregar a la lista
        setProducts(prevProducts => [...prevProducts, savedProduct]);
      }
      
      setShowProductModal(false);
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setError('No se pudo guardar el producto. Por favor, intente de nuevo.');
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando datos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="product-management-container">
      <div className="page-header">
        <button 
          className="back-button" 
          onClick={() => navigate('/admin/restaurantes')}
        >
          <FaArrowLeft />
        </button>
        <div className="page-title">
          <h2>Productos</h2>
          {restaurant && <p>{restaurant.nombre}</p>}
        </div>
        <button 
          className="add-product-btn" 
          onClick={handleAddProduct}
        >
          <FaPlus /> Agregar Producto
        </button>
      </div>
      
      <div className="product-search">
        <div className="search-field">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      
      {filteredProducts.length === 0 ? (
        <div className="empty-products">
          <h3>No hay productos</h3>
          <p>Comienza agregando productos a tu restaurante</p>
          <button onClick={handleAddProduct} className="add-empty-btn">
            <FaPlus /> Agregar Producto
          </button>
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th className="image-column">Imagen</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Precio</th>
                <th className="actions-column">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td className="image-column">
                    {product.imagen ? (
                      <img src={product.imagen} alt={product.nombre} className="product-image" />
                    ) : (
                      <div className="image-placeholder">
                        <span>Sin Imagen</span>
                      </div>
                    )}
                  </td>
                  <td>{product.nombre}</td>
                  <td>{product.especificaciones || 'Sin descripción'}</td>
                  <td>{formatPrice(product.precio)}</td>
                  <td className="actions-column">
                    <button 
                      className="action-button edit" 
                      onClick={() => handleEditProduct(product)}
                      title="Editar producto"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="action-button delete" 
                      onClick={() => confirmDeleteProduct(product)}
                      title="Eliminar producto"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal para agregar/editar producto */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="product-modal">
            <ProductForm 
              product={currentProduct}
              isEditing={isEditing}
              onSave={handleSaveProduct}
              onCancel={() => setShowProductModal(false)}
              restauranteId={restauranteId}
            />
          </div>
        </div>
      )}
      
      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Confirmar Eliminación</h3>
            <p>¿Está seguro que desea eliminar el producto <strong>{productToDelete?.nombre}</strong>?</p>
            <p className="warning-text">Esta acción no se puede deshacer.</p>
            <div className="modal-actions">
              <button 
                className="cancel-button" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="delete-button" 
                onClick={handleDeleteProduct}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}