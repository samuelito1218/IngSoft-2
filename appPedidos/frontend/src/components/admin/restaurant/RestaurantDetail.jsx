//
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaPlus, FaStore, FaUtensils, FaEdit, 
  FaMapMarkerAlt, FaClipboardList, FaClock, FaSearch, 
  FaTrash, FaCamera, FaBuilding 
} from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../services/api';
import ProductForm from '../productos/ProductForm';
import CloudinaryService from '../../../services/CloudinaryService';
import SucursalesManagement from '../SucursalesManagement';
import './RestaurantDetail.css';

const RestaurantDetail = () => {
  const { restaurantId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estados principales
  const [restaurant, setRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showSucursalesModal, setShowSucursalesModal] = useState(false);
  
  // Estados para productos
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // Estados para pedidos (solo visualización)
  const [orders, setOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [inProcessOrders, setInProcessOrders] = useState([]);
  const [readyOrders, setReadyOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [activeOrdersTab, setActiveOrdersTab] = useState('completed'); // ✅ CAMBIADO: Inicializar en 'completed'
  
  // Estado para imagen
  const [isUploading, setIsUploading] = useState(false);

  // Función para abrir modal de sucursales
  const handleOpenSucursales = () => {
    setShowSucursalesModal(true);
  };
  
  // Función para cerrar modal de sucursales
  const handleCloseSucursales = () => {
    setShowSucursalesModal(false);
  };
  
  // Obtener datos del restaurante
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener información del restaurante
        const response = await api.get(`/restaurantes/${restaurantId}`);
        setRestaurant(response.data);
        
        // Obtener productos del restaurante
        const productsResponse = await api.get(`/restaurantes/${restaurantId}/productos`);
        console.log("🔍 RESPUESTA COMPLETA DE PRODUCTOS:", productsResponse.data);

        // Debug cada producto individualmente
        if (productsResponse.data && productsResponse.data.length > 0) {
          productsResponse.data.forEach((product, index) => {
            console.log(`📦 PRODUCTO ${index + 1}:`, {
              id: product.id,
              nombre: product.nombre,
              imagen: product.imagen,
              imageUrl: product.imageUrl,
              image: product.image,
              foto: product.foto,
              picture: product.picture,
              media: product.media,
              // Mostrar TODAS las propiedades
              todasLasPropiedades: Object.keys(product)
            });
          });
        }

        setProducts(productsResponse.data || []);
        setFilteredProducts(productsResponse.data || []);
        
        // Obtener pedidos del restaurante (solo para visualización)
        try {
          const ordersResponse = await api.get(`/pedidos/restaurante/${restaurantId}`);
          setOrders(ordersResponse.data || []);
          
          // Clasificar pedidos para mostrar en diferentes pestañas
          const pendingOrders = ordersResponse.data?.filter(order => order.estado === 'Pendiente') || [];
          const inProcessOrders = ordersResponse.data?.filter(order => order.estado === 'En_Preparacion') || [];
          const readyOrders = ordersResponse.data?.filter(order => order.estado === 'Preparado') || [];
          const completedOrders = ordersResponse.data?.filter(order => 
            order.estado === 'Entregado' || order.estado === 'Cancelado'
          ) || [];
          
          setPendingOrders(pendingOrders);
          setInProcessOrders(inProcessOrders);
          setReadyOrders(readyOrders);
          setCompletedOrders(completedOrders);
        } catch (err) {
          console.error('Error al cargar pedidos:', err);
          // No establecemos error global, solo mostramos mensaje en consola
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('No se pudieron cargar los datos. Por favor, intente de nuevo.');
        setLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, [restaurantId, refreshTrigger]);
  
  // Filtrar productos cuando cambia el término de búsqueda
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
  
  // Manejar cambio en el campo de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Navegar hacia atrás
  const handleBack = () => {
    navigate('/admin/restaurantes');
  };
  
  // Editar restaurante
  const handleEditRestaurant = () => {
    navigate(`/admin/restaurantes/editar/${restaurantId}`);
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
      await api.delete(`/productos/${productToDelete.id}`);
      
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
        const res = await api.put(`/productos/${currentProduct.id}`, productData);
        savedProduct = res.data.producto || res.data;
        
        // Actualizar en la lista
        setProducts(prevProducts => 
          prevProducts.map(p => p.id === savedProduct.id ? savedProduct : p)
        );
      } else {
        // Crear nuevo producto
        const res = await api.post('/productos', {
          ...productData,
          restaurante_Id: restaurantId
        });
        savedProduct = res.data.producto || res.data;
        
        // Agregar a la lista
        setProducts(prevProducts => [...prevProducts, savedProduct]);
      }
      
      setShowProductModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error al guardar producto:", err);
      setError('No se pudo guardar el producto. Por favor, intente de nuevo.');
    }
  };
  
  // Manejar la subida de imagen del restaurante
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Subir imagen a Cloudinary
      const imageUrl = await CloudinaryService.uploadImage(file, 'restaurantes');
      
      // Actualizar restaurante con nueva imagen
      await api.put(`/restaurantes/${restaurantId}/imagen`, { imageUrl });
      
      // Actualizar estado local
      setRestaurant(prev => ({
        ...prev,
        imageUrl
      }));
      
      setIsUploading(false);
    } catch (error) {
      console.error('Error al subir imagen:', error);
      setIsUploading(false);
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
  
  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Renderizar lista de productos
  const renderProductsList = () => {
    if (filteredProducts.length === 0) {
      return (
        <div className="empty-products">
          <FaUtensils className="empty-icon" />
          <h3>No hay productos</h3>
          <p>Comienza agregando productos a tu restaurante</p>
          <button onClick={handleAddProduct} className="add-empty-btn">
            <FaPlus /> Agregar Producto
          </button>
        </div>
      );
    }
    
    return (
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
                  <div className="product-image-container">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.nombre} 
                        className="product-image"
                        title={`Ver imagen de ${product.nombre}`}
                        loading="lazy"
                        onError={(e) => {
                          console.error("Error cargando imagen de Cloudinary:", {
                            producto: product.nombre,
                            url: e.target.src,
                            status: e.target.complete
                          });
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <FaUtensils />
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
    );
  };
  
  // Renderizar pedidos según pestaña activa (SOLO VISUALIZACIÓN)
  const renderOrders = () => {
    let ordersToShow = [];
    
    switch (activeOrdersTab) {
      case 'pending':
        ordersToShow = pendingOrders;
        break;
      case 'inProcess':
        ordersToShow = inProcessOrders;
        break;
      case 'ready':
        ordersToShow = readyOrders;
        break;
      case 'completed':
        ordersToShow = completedOrders;
        break;
      default:
        ordersToShow = completedOrders; // ✅ CAMBIADO: Default a completedOrders
    }
    
    if (ordersToShow.length === 0) {
      return (
        <div className="empty-orders">
          <FaClipboardList className="empty-icon" />
          <h3>No hay pedidos en esta categoría</h3>
        </div>
      );
    }
    
    return (
      <div className="orders-container">
        {ordersToShow.map(order => (
          <div key={order.id} className={`order-card ${order.estado.toLowerCase()}`}>
            <div className="order-header">
              <h3>Pedido #{order.id.substring(0, 8)}</h3>
              <span className={`order-status ${order.estado.toLowerCase()}`}>
                {order.estado.replace('_', ' ')}
              </span>
            </div>
            
            <div className="order-info">
              <p className="order-date">
                <FaClock /> {formatDate(order.fechaDeCreacion)}
              </p>
              <p className="order-client">
                <strong>Cliente:</strong> {order.cliente?.nombreCompleto || 'Cliente'}
              </p>
              <p className="order-address">
                <FaMapMarkerAlt /> {order.direccionEntrega.barrio}, Comuna {order.direccionEntrega.comuna} - {order.direccionEntrega.direccionEspecifica}
              </p>
            </div>
            
            <div className="order-products">
              <h4>Productos:</h4>
              <ul>
                {order.productos.map((item, index) => (
                  <li key={index}>
                    {item.nombre || `Producto ${item.productoId.substring(0, 6)}`} x{item.cantidad} - {formatPrice(item.precio * item.cantidad)}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="order-footer">
              <p className="order-total">
                <strong>Total:</strong> {formatPrice(order.total)}
              </p>
              
              {/* ✅ ELIMINADO: Ya no hay botones de acción para gestionar pedidos */}
              <div className="order-info-note">
                <p style={{ 
                  fontSize: '14px', 
                  color: '#666', 
                  fontStyle: 'italic',
                  textAlign: 'center',
                  margin: '10px 0 0 0',
                  padding: '8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px'
                }}>
                  📋 Este pedido es gestionado por el sistema de reparto
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando información del restaurante...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={handleBack}>Volver al panel</button>
      </div>
    );
  }
  
  if (!restaurant) {
    return (
      <div className="error-container">
        <p>No se encontró el restaurante solicitado.</p>
        <button onClick={handleBack}>Volver al panel</button>
      </div>
    );
  }
  
  return (
    <div className="restaurant-detail">
      <div className="detail-header">
        <button className="back-button" onClick={handleBack}>
          <FaArrowLeft />
        </button>
        
        <div className="restaurant-info">
          <div className="restaurant-title-section">
            <h2>{restaurant.nombre}</h2>
            
            {/* Botón Gestión de Sucursales */}
            <button 
              className="manage-branches-btn"
              onClick={handleOpenSucursales}
              title="Gestionar Sucursales"
            >
              <FaBuilding />
              <span>Gestionar Sucursales</span>
            </button>
          </div>
          
          <div className="restaurant-meta">
            {restaurant.categorias && restaurant.categorias.length > 0 && (
              <div className="meta-item">
                <span className="category-tag">{restaurant.categorias.join(', ')}</span>
              </div>
            )}
            
            {restaurant.ubicaciones && restaurant.ubicaciones.length > 0 && (
              <div className="meta-item">
                <FaMapMarkerAlt className="meta-icon" />
                <span>
                  {restaurant.ubicaciones.map(ub => ub.comuna).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <button className="edit-button" onClick={handleEditRestaurant}>
          <FaEdit /> Editar Restaurante
        </button>
      </div>
      
      <div className="restaurant-banner">
        <div className="image-container">
          {restaurant.imageUrl ? (
            <img 
              src={restaurant.imageUrl} 
              alt={restaurant.nombre} 
              className="banner-image"
            />
          ) : (
            <div className="image-placeholder">
              <FaStore className="placeholder-icon" />
              <p>Sin imagen</p>
            </div>
          )}
          <label className="upload-image-label" title="Cambiar imagen">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              disabled={isUploading}
              style={{ display: 'none' }}
            />
            <FaCamera />
          </label>
        </div>
      </div>
      
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <FaUtensils /> Productos
        </button>
        
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('orders');
            setActiveOrdersTab('completed'); // ✅ AGREGADO: Establecer automáticamente en completados
          }}
        >
          <FaClipboardList /> Ver Pedidos
          {pendingOrders.length > 0 && (
            <span className="badge">{pendingOrders.length}</span>
          )}
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'products' && (
          <div className="products-tab">
            <div className="section-header">
              <h3>Gestión de Productos</h3>
              
              <div className="header-actions">
                <div className="search-field">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
                
                <button className="create-button" onClick={handleAddProduct}>
                  <FaPlus /> Nuevo Producto
                </button>
              </div>
            </div>
            
            {renderProductsList()}
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div className="orders-tab">
            <div className="section-header">
              <h3>Visualización de Pedidos</h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#666', 
                margin: '5px 0 0 0' 
              }}>
                Los pedidos son gestionados automáticamente por el sistema
              </p>
            </div>
            
            <div className="orders-nav">
              <button 
                className={`orders-tab-btn ${activeOrdersTab === 'completed' ? 'active' : ''}`} 
                onClick={() => setActiveOrdersTab('completed')}
              >
                Completados / Cancelados
              </button>
            </div>
            
            {renderOrders()}
          </div>
        )}
      </div>
      
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
      
      {/* Modal de confirmación para eliminar producto */}
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
      
      {/* Modal de Sucursales */}
      {showSucursalesModal && (
        <SucursalesManagement
          restaurante={restaurant}
          onClose={handleCloseSucursales}
        />
      )}
    </div>
  );
};

export default RestaurantDetail;