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
    
    // Usar una estructura try/catch independiente para cada llamada API
    let restaurantsData = [];
    
    try {
      const response = await ApiService.restaurantes.listar();
      console.log('Respuesta completa:', response);
      console.log('Data:', response.data);
      console.log('¿Es un array?', Array.isArray(response.data));
      console.log('Longitud:', response.data ? response.data.length : 'N/A');
      
      // Manejo más flexible de la respuesta
      if (response && response.data) {
        // Si es un array directamente
        if (Array.isArray(response.data)) {
          restaurantsData = response.data;
        } 
        // Si la respuesta tiene una propiedad 'restaurantes' o similar
        else if (response.data.restaurantes && Array.isArray(response.data.restaurantes)) {
          restaurantsData = response.data.restaurantes;
        }
        // Si es un objeto simple, convertirlo en array
        else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          restaurantsData = [response.data];
        }
      }
      
      // Asegurarse de que los restaurantes tengan las propiedades necesarias
      restaurantsData = restaurantsData.map(r => ({
        id: r.id || `temp-${Math.random()}`,
        nombre: r.nombre || 'Restaurante sin nombre',
        descripcion: r.descripcion || '',
        imageUrl: r.imageUrl || null,
        categorias: Array.isArray(r.categorias) ? r.categorias : ['General']
      }));
      
      console.log('Restaurantes procesados:', restaurantsData);
    } catch (apiError) {
      console.error('Error en API de restaurantes:', apiError);
      
      // Agregar al menos un restaurante ficticio si hay un error
      restaurantsData = [{
        id: 'demo-1',
        nombre: 'Restaurante Demo',
        descripcion: 'Este es un restaurante de demostración mientras se cargan los datos reales.',
        imageUrl: null,
        categorias: ['General']
      }];
      console.log('Usando restaurante de demostración:', restaurantsData);
    }
    
    // Si después de todo no hay restaurantes, agregar uno ficticio
    if (restaurantsData.length === 0) {
      restaurantsData = [{
        id: 'demo-2',
        nombre: 'Restaurante FastFood',
        descripcion: 'No se encontraron restaurantes. Este es un ejemplo para fines de prueba.',
        imageUrl: null,
        categorias: ['General']
      }];
      console.log('No se encontraron restaurantes, usando datos de respaldo:', restaurantsData);
    }
    
    setRestaurants(restaurantsData);
    setFilteredRestaurants(restaurantsData);
    
    // Extraer categorías únicas de manera segura
    const uniqueCategories = [...new Set(
      restaurantsData.flatMap(restaurant => 
        restaurant.categorias || ['General']
      )
    )];
    
    setCategories(['All', ...uniqueCategories]);
    
    // Pedido activo en bloque try/catch separado
    try {
      const pedidoResponse = await ApiService.pedidos.activo();
      console.log('Respuesta de pedido activo:', pedidoResponse);
      if (pedidoResponse && pedidoResponse.data && pedidoResponse.data.pedido) {
        setActivePedido(pedidoResponse.data);
        console.log('Pedido activo encontrado:', pedidoResponse.data);
      }
    } catch (pedidoError) {
      console.error('Error al cargar pedido activo:', pedidoError);
      // No bloqueamos la UI por este error
    }
    
    setLoading(false);
  } catch (globalError) {
    console.error('Error general:', globalError);
    setError('No se pudieron cargar los datos. Intente nuevamente.');
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