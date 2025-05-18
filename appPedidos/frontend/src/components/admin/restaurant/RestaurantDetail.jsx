// src/components/admin/restaurant/RestaurantDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaStore, FaUtensils, FaEdit, FaMapMarkerAlt, FaClipboardList } from 'react-icons/fa';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../services/api';
import ProductList from '../products/ProductList';
import OrderQueue from '../orders/OrderQueue';
import './RestaurantDetail.css';

const RestaurantDetail = () => {
  const { restaurantId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [restaurant, setRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'orders', 'stats'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/restaurantes/${restaurantId}`);
        
        if (response.data) {
          setRestaurant(response.data);
        } else {
          throw new Error('No se encontró el restaurante');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar restaurante:', err);
        setError('No se pudo cargar la información del restaurante');
        setLoading(false);
      }
    };
    
    fetchRestaurant();
  }, [restaurantId]);
  
  const handleBack = () => {
    navigate('/admin');
  };
  
  const handleEditRestaurant = () => {
    navigate(`/admin/restaurantes/editar/${restaurantId}`);
  };
  
  const handleCreateProduct = () => {
    navigate(`/admin/productos/${restaurantId}/nuevo`);
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
          <h2>{restaurant.nombre}</h2>
          
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
        <img 
          src={restaurant.imageUrl || '/images/restaurant-banner.jpg'} 
          alt={restaurant.nombre} 
          className="banner-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/restaurant-banner.jpg';
          }}
        />
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
          onClick={() => setActiveTab('orders')}
        >
          <FaClipboardList /> Pedidos
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'products' && (
          <div className="products-tab">
            <div className="section-header">
              <h3>Gestión de Productos</h3>
              
              <button className="create-button" onClick={handleCreateProduct}>
                <FaPlus /> Nuevo Producto
              </button>
            </div>
            
            <ProductList restaurantId={restaurantId} />
          </div>
        )}
        
        {activeTab === 'orders' && (
          <div className="orders-tab">
            <div className="section-header">
              <h3>Gestión de Pedidos</h3>
            </div>
            
            <OrderQueue restaurantId={restaurantId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetail;