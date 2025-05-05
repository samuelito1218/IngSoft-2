// src/components/client/ClientHome.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import ExploreMenu from '../ExploreMenu';
import RestaurantCard from '../restaurantcard/RestaurantCard';
import OrderActiveAlert from '../orderactivealert/OrderActiveAlert';
import ApiService from '../../../services/api';
import './ClientHome.css';
import { FaSearch, FaMapMarkerAlt, FaStore } from 'react-icons/fa';

const ClientHome = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePedido, setActivePedido] = useState(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Cargar restaurantes al iniciar
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const response = await ApiService.restaurantes.listar();
        
        if (response.data && Array.isArray(response.data)) {
          setRestaurants(response.data);
          setFilteredRestaurants(response.data);
          
          // Extraer categorías únicas
          const uniqueCategories = [...new Set(
            response.data.flatMap(restaurant => 
              restaurant.categorias || ['General']
            )
          )];
          
          setCategories(['All', ...uniqueCategories]);
        }
        
        // Verificar si hay un pedido activo
        const pedidoResponse = await ApiService.pedidos.activo();
        if (pedidoResponse.data && pedidoResponse.data.pedido) {
          setActivePedido(pedidoResponse.data);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar restaurantes:', error);
        setError('No se pudieron cargar los restaurantes. Intente nuevamente.');
        setLoading(false);
      }
    };
    
    fetchRestaurants();
  }, []);
  
  // Filtrar restaurantes cuando cambia la categoría o el término de búsqueda
  useEffect(() => {
    let filtered = [...restaurants];
    
    // Filtrar por categoría
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(restaurant => 
        restaurant.categorias && 
        restaurant.categorias.includes(selectedCategory)
      );
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(restaurant => 
        restaurant.nombre.toLowerCase().includes(term) ||
        (restaurant.descripcion && restaurant.descripcion.toLowerCase().includes(term))
      );
    }
    
    setFilteredRestaurants(filtered);
  }, [selectedCategory, searchTerm, restaurants]);
  
  // Manejar la selección de categoría
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };
  
  // Manejar cambio en el campo de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Ir al detalle del restaurante
  const handleRestaurantClick = (restaurantId) => {
    navigate(`/cliente/restaurante/${restaurantId}`);
  };
  
  // Ir al seguimiento del pedido activo
  const goToActiveOrder = () => {
    if (activePedido && activePedido.pedido) {
      navigate(`/cliente/delivery-tracking/${activePedido.pedido.id}`);
    }
  };
  
  if (loading) {
    return (
      <div className="client-home-loading">
        <div className="spinner"></div>
        <p>Cargando restaurantes...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="client-home-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }
  
  return (
    <div className="client-home">
      {activePedido && (
        <OrderActiveAlert 
          pedido={activePedido.pedido}
          onClick={goToActiveOrder}
        />
      )}
      
      <div className="hero-section">
        <div className="hero-content">
          <h1>Deliciosa comida<br />a tu puerta</h1>
          <p>Ordena de los mejores restaurantes de la ciudad</p>
          
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar restaurantes, comida..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>
      
      <div className="content-container">
        <ExploreMenu 
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
        
        {filteredRestaurants.length === 0 ? (
          <div className="no-results">
            <FaStore className="no-results-icon" />
            <h3>No se encontraron restaurantes</h3>
            <p>Intenta con otra categoría o término de búsqueda</p>
          </div>
        ) : (
          <div className="restaurants-grid">
            {filteredRestaurants.map(restaurant => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onClick={() => handleRestaurantClick(restaurant.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientHome;