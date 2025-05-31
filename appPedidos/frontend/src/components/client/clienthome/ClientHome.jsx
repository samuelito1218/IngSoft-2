import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useMultipleRatings } from '../../../hooks/useRating';
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

  const restaurantIds = restaurants.map(restaurant => restaurant.id);
  
  const { ratings, loading: ratingsLoading } = useMultipleRatings(restaurantIds);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);

        let restaurantsData = [];
        
        try {
          const response = await ApiService.restaurantes.listar();
          console.log('Respuesta completa:', response);
          console.log('Data:', response.data);
          console.log('¿Es un array?', Array.isArray(response.data));
          console.log('Longitud:', response.data ? response.data.length : 'N/A');

          if (response && response.data) {

            if (Array.isArray(response.data)) {
              restaurantsData = response.data;
            } 
            else if (response.data.restaurantes && Array.isArray(response.data.restaurantes)) {
              restaurantsData = response.data.restaurantes;
            }
            else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
              restaurantsData = [response.data];
            }
          }
          restaurantsData = restaurantsData.map(r => ({
            id: r.id || `temp-${Math.random()}`,
            nombre: r.nombre || 'Restaurante sin nombre',
            descripcion: r.descripcion || '',
            imageUrl: r.imageUrl || null,
            imagen: r.imagen || null,
            categorias: Array.isArray(r.categorias) ? r.categorias : ['General'],
            tiempoEntrega: r.tiempoEntrega || '30-45 min',
            ubicaciones: r.ubicaciones || [],
            envioGratis: r.envioGratis || false
          }));
          
          console.log('Restaurantes procesados:', restaurantsData);
        } catch (apiError) {
          console.error('Error en API de restaurantes:', apiError);
          
          restaurantsData = [{
            id: 'demo-1',
            nombre: 'Restaurante Demo',
            descripcion: 'Este es un restaurante de demostración mientras se cargan los datos reales.',
            imageUrl: null,
            imagen: null,
            categorias: ['General'],
            tiempoEntrega: '30-45 min',
            ubicaciones: [],
            envioGratis: false
          }];
          console.log('Usando restaurante de demostración:', restaurantsData);
        }

        if (restaurantsData.length === 0) {
          restaurantsData = [{
            id: 'demo-2',
            nombre: 'Restaurante FastFood',
            descripcion: 'No se encontraron restaurantes. Este es un ejemplo para fines de prueba.',
            imageUrl: null,
            imagen: null,
            categorias: ['General'],
            tiempoEntrega: '30-45 min',
            ubicaciones: [],
            envioGratis: false
          }];
          console.log('No se encontraron restaurantes, usando datos de respaldo:', restaurantsData);
        }
        
        setRestaurants(restaurantsData);
        setFilteredRestaurants(restaurantsData);

        const uniqueCategories = [...new Set(
          restaurantsData.flatMap(restaurant => 
            restaurant.categorias || ['General']
          )
        )];
        
        setCategories(['All', ...uniqueCategories]);

        try {
          const pedidoResponse = await ApiService.pedidos.activo();
          console.log('Respuesta de pedido activo:', pedidoResponse);
          if (pedidoResponse && pedidoResponse.data && pedidoResponse.data.pedido) {
            setActivePedido(pedidoResponse.data);
            console.log('Pedido activo encontrado:', pedidoResponse.data);
          }
        } catch (pedidoError) {
          console.error('Error al cargar pedido activo:', pedidoError);
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
  
  useEffect(() => {
    let filtered = [...restaurants];

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(restaurant => 
        restaurant.categorias && 
        restaurant.categorias.includes(selectedCategory)
      );
    }
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(restaurant => 
        restaurant.nombre.toLowerCase().includes(term) ||
        (restaurant.descripcion && restaurant.descripcion.toLowerCase().includes(term))
      );
    }
    
    setFilteredRestaurants(filtered);
  }, [selectedCategory, searchTerm, restaurants]);
 
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };
 
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleRestaurantClick = (restaurantId) => {
    navigate(`/cliente/restaurante/${restaurantId}`);
  };
 
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
        
        {filteredRestaurants.length === 0 ? (
          <div className="no-results">
            <FaStore className="no-results-icon" />
            <h3>No se encontraron restaurantes</h3>
            <p>Intenta con otra categoría o término de búsqueda</p>
          </div>
        ) : (
          <div className="restaurants-grid">
            {filteredRestaurants.map(restaurant => {
              const restaurantWithRating = {
                ...restaurant,
                calificacionPromedio: ratings[restaurant.id]?.calificacionPromedio || 0,
                totalCalificaciones: ratings[restaurant.id]?.totalCalificaciones || 0,
                ratingLoading: ratingsLoading
              };
              
              return (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurantWithRating}
                  onClick={() => handleRestaurantClick(restaurant.id)}
                />
              );
            })}
          </div>
        )}
        
        {ratingsLoading && (
          <div className="ratings-loading-indicator">
            <p>Cargando calificaciones...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientHome;