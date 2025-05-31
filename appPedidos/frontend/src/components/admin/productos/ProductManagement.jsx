import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { api } from '../../../services/api';
import { useAuth } from '../../../hooks/useAuth';
import ProductForm from './ProductForm';
import './ProductManagement.css';

export default function ProductManagement() {
  const params = useParams();
  const restaurantId = params.restaurantId || params.restauranteId || params.id;
  
  const { token, user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!token || !isAuthenticated) {
          setError('No se pudo autenticar. Por favor, inicie sesión de nuevo.');
          setLoading(false);
          return;
        }
        
        if (!restaurantId) {
          setError('ID de restaurante no válido.');
          setLoading(false);
          return;
        }

        const restaurantRes = await api.get(`/restaurantes/${restaurantId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRestaurant(restaurantRes.data);

        const productsRes = await api.get(`/restaurantes/${restaurantId}/productos`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setProducts(productsRes.data || []);
        setFilteredProducts(productsRes.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        if (err.response?.status === 401) {
          setError('Sesión expirada. Por favor, inicie sesión de nuevo.');
        } else if (err.response?.status === 404) {
          setError('Restaurante no encontrado o no tienes permisos para acceder.');
        } else {
          setError('No se pudieron cargar los datos. Por favor, intente de nuevo.');
        }
        setLoading(false);
      }
    };

    if (token && !authLoading && restaurantId) {
      fetchData();
    } else if (!authLoading && !token) {
      setLoading(false);
      setError('No se pudo autenticar. Por favor, inicie sesión de nuevo.');
    }
  }, [restaurantId, token, isAuthenticated, authLoading]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.especificaciones && product.especificaciones.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAddProduct = () => {
    setCurrentProduct(null);
    setIsEditing(false);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setIsEditing(true);
    setShowProductModal(true);
  };

  const confirmDeleteProduct = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    try {
      await api.delete(`/productos/${productToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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

  const handleSaveProduct = async (productData) => {
    try {
      if (!token || !isAuthenticated) {
        throw new Error('No hay token de autenticación válido. Por favor, inicie sesión de nuevo.');
      }
      
      let savedProduct;
      
      if (isEditing && currentProduct) {

        const res = await api.put(`/productos/${currentProduct.id}`, productData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        savedProduct = res.data.producto || res.data;
      
        setProducts(prevProducts => 
          prevProducts.map(p => p.id === savedProduct.id ? savedProduct : p)
        );
      } else {
        // Crear nuevo producto
        const dataWithRestaurant = {
          ...productData,
          restaurante_Id: restaurantId
        };
        
        const res = await api.post('/productos', dataWithRestaurant, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        savedProduct = res.data.producto || res.data;
        
        // Agregar a la lista
        setProducts(prevProducts => [...prevProducts, savedProduct]);
      }
      
      setShowProductModal(false);
      setCurrentProduct(null);
      setIsEditing(false);
      
    } catch (err) {
      console.error("Error al guardar producto:", err);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          err.message || 
                          'No se pudo guardar el producto. Por favor, intente de nuevo.';
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return (
      <div className="error-container">
        <p>No tienes acceso a esta página. Por favor, inicia sesión.</p>
        <button onClick={() => navigate('/login')} className="retry-button">
          Ir a Login
        </button>
      </div>
    );
  }

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
      
      {Array.isArray(filteredProducts) && filteredProducts.length === 0 ? (
        <div className="empty-products">
          <h3>No hay productos</h3>
          <p>Comienza agregando productos a tu restaurante</p>
          <button onClick={handleAddProduct} className="add-empty-btn">
            <FaPlus /> Agregar Producto
          </button>
        </div>
      ) : (
        filteredProducts.length > 0 && (
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
                      <div className="product-image-wrapper">
                        {product.imagen || product.imageUrl ? (
                          <img 
                            src={product.imagen || product.imageUrl} 
                            alt={product.nombre} 
                            className="product-image"
                            title={`Ver imagen de ${product.nombre}`}
                            loading="lazy"
                          />
                        ) : (
                          <div className="image-placeholder">
                            <span>Sin Imagen</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{product.nombre}</td>
                    <td>{product.especificaciones || 'Sin descripción'}</td>
                    <td>{formatPrice(product.precio)}</td>
                    <td className="actions-column">
                      <button 
                        className="action-button edit" 
                        onClick={() => handleEditProduct(product)}
                        title="Editar producto"
                        aria-label="Editar producto"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="action-button delete" 
                        onClick={() => confirmDeleteProduct(product)}
                        title="Eliminar producto"
                        aria-label="Eliminar producto"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
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
              restauranteId={restaurantId}
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