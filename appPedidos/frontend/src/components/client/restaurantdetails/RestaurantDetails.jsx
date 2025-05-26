// src/components/client/RestaurantDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useRating } from '../../../hooks/useRating';
import FoodItem from '../fooditem/FoodItem';
import OrderActiveAlert from '../orderactivealert/OrderActiveAlert';
import ApiService from '../../../services/api';
import './RestaurantDetails.css';
import { 
  FaArrowLeft, FaStar, FaClock, FaMapMarkerAlt, 
  FaSearch, FaUtensils, FaDrumstickBite, FaPizzaSlice,
  FaWineGlassAlt, FaIceCream
} from 'react-icons/fa';

const RestaurantDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Usar el hook para obtener calificaciones reales
  const { calificacionPromedio, totalCalificaciones, loading: ratingLoading } = useRating(id);
  
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePedido, setActivePedido] = useState(null);
  
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Categorías de productos
  const [productCategories, setProductCategories] = useState([
    { id: 'Todos', name: 'Todos', icon: <FaUtensils /> }
  ]);
  
  // Cargar información del restaurante
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener información del restaurante
        const restaurantResponse = await ApiService.restaurantes.detalle(id);
        if (restaurantResponse.data) {
          setRestaurant(restaurantResponse.data);
        } else {
          throw new Error('No se encontró información del restaurante');
        }
        
        // Obtener productos del restaurante
        const productsResponse = await ApiService.restaurantes.productos(id);
        if (productsResponse.data && Array.isArray(productsResponse.data)) {
          setProducts(productsResponse.data);
          setFilteredProducts(productsResponse.data);
          
          // Extraer categorías únicas de los productos
          const uniqueCategories = ['Todos', ...new Set(
            productsResponse.data.map(product => product.categoria || 'General')
          )];
          
          // Asignar íconos a las categorías
          const categoriesWithIcons = uniqueCategories.map(category => {
            let icon = <FaUtensils />;
            
            switch (category.toLowerCase()) {
              case 'carnes':
              case 'carne':
                icon = <FaDrumstickBite />;
                break;
              case 'pizzas':
              case 'pizza':
                icon = <FaPizzaSlice />;
                break;
              case 'bebidas':
              case 'bebida':
                icon = <FaWineGlassAlt />;
                break;
              case 'postres':
              case 'postre':
                icon = <FaIceCream />;
                break;
              default:
                icon = <FaUtensils />;
            }
            
            return {
              id: category,
              name: category,
              icon
            };
          });
          
          setProductCategories(categoriesWithIcons);
        }
        
        // Verificar pedido activo
        try {
          const pedidoResponse = await ApiService.pedidos.activo();
          if (pedidoResponse.data && pedidoResponse.data.pedido) {
            setActivePedido(pedidoResponse.data);
          }
        } catch (pedidoError) {
          console.error('Error al obtener pedido activo:', pedidoError);
          // No es crítico, continuar sin pedido activo
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar información del restaurante:', error);
        setError('No se pudo cargar la información del restaurante. Intente nuevamente.');
        setLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, [id]);
  
  // Filtrar productos cuando cambia la categoría o el término de búsqueda
  useEffect(() => {
    if (!products.length) return;
    
    let filtered = [...products];
    
    // Filtrar por categoría
    if (selectedCategory !== 'Todos') {
      filtered = filtered.filter(product => 
        product.categoria === selectedCategory
      );
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product => 
        product.nombre.toLowerCase().includes(term) ||
        (product.descripcion && product.descripcion.toLowerCase().includes(term))
      );
    }
    
    setFilteredProducts(filtered);
  }, [selectedCategory, searchTerm, products]);
  
  // Formatear la calificación para mostrar
  const formatRating = (rating) => {
    if (rating === 0) return '0.0';
    return Number(rating).toFixed(1);
  };
  
  // Ir al detalle del producto
  const handleProductClick = (productId) => {
    navigate(`/cliente/producto/${productId}`);
  };
  
  // Ir al seguimiento del pedido activo
  const goToActiveOrder = () => {
    if (activePedido && activePedido.pedido) {
      navigate(`/cliente/delivery-tracking/${activePedido.pedido.id}`);
    }
  };
  
  // Volver atrás
  const handleBack = () => {
    navigate(-1);
  };
  
  // Cambiar categoría seleccionada
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };
  
  // Manejar cambio en el campo de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  if (loading) {
    return (
      <div className="restaurant-details-loading">
        <div className="spinner"></div>
        <p>Cargando información del restaurante...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="restaurant-details-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
        <button onClick={handleBack} className="secondary">Volver atrás</button>
      </div>
    );
  }
  
  if (!restaurant) {
    return (
      <div className="restaurant-details-error">
        <p>No se encontró el restaurante solicitado.</p>
        <button onClick={handleBack}>Volver a restaurantes</button>
      </div>
    );
  }
  
  return (
    <div className="restaurant-details-wrapper">
      {activePedido && (
        <OrderActiveAlert 
          pedido={activePedido.pedido}
          onClick={goToActiveOrder}
          className="order-alert"
        />
      )}
      
      <div className="restaurant-header">
        <div className="restaurant-banner">
          <img 
            src={restaurant.imagen || '/images/restaurant-banner.jpg'} 
            alt={restaurant.nombre}
          />
          <button className="back-button" onClick={handleBack}>
            <FaArrowLeft />
          </button>
        </div>
        
        <div className="restaurant-info-container">
          <div className="restaurant-info">
            <h1 className="restaurant-name">{restaurant.nombre}</h1>
            
            <div className="restaurant-meta">
              <div className="meta-item">
                <FaStar className="meta-icon star" />
                {ratingLoading ? (
                  <span className="rating-loading">Cargando...</span>
                ) : (
                  <>
                    <span>{formatRating(calificacionPromedio)}</span>
                    <span className="meta-count">({totalCalificaciones} calificaciones)</span>
                  </>
                )}
              </div>
              
              <div className="meta-item">
                <FaClock className="meta-icon" />
                <span>{restaurant.tiempoEntrega || '30-45 min'}</span>
              </div>
              
              {restaurant.ubicaciones && restaurant.ubicaciones.length > 0 && (
                <div className="meta-item">
                  <FaMapMarkerAlt className="meta-icon" />
                  <span>{restaurant.ubicaciones[0].comuna || 'Cali'}</span>
                </div>
              )}
            </div>
            
            {restaurant.descripcion && (
              <p className="restaurant-description">{restaurant.descripcion}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="products-main-container">
        <aside className="products-sidebar">
          <div className="products-search">
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
          
          <h3 className="categories-title">Categorías</h3>
          <div className="product-categories">
            {productCategories.map(category => (
              <div
                key={category.id}
                className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => handleCategoryChange(category.id)}
              >
                <div className="category-icon">
                  {category.icon}
                </div>
                <span className="category-name">{category.name}</span>
              </div>
            ))}
          </div>
        </aside>
        
        <main className="products-content">
          <h2 className="products-title">
            {selectedCategory === 'Todos' ? 'Todos los productos' : selectedCategory}
          </h2>
          
          {filteredProducts.length === 0 ? (
            <div className="no-products">
              <p>No se encontraron productos con los criterios seleccionados.</p>
              <button onClick={() => { setSelectedCategory('Todos'); setSearchTerm(''); }}>
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="products-grid">
  {filteredProducts.map(product => (
    <FoodItem
      key={product.id}
      product={product}
      restaurantName={restaurant.nombre} 
      onClick={() => handleProductClick(product.id)}
    />
  ))}
</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RestaurantDetails;