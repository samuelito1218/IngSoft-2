import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/RestaurantDetails.css';

function RestaurantDetails() {
  const { id } = useParams(); // ID del restaurante
  const navigate = useNavigate();
  
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [isFavorite, setIsFavorite] = useState(false);
  
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        setLoading(true);
        
        // Aquí harías las llamadas a la API para obtener el restaurante y su menú
        // const restaurantResponse = await api.get(`/restaurantes/${id}`);
        // const menuResponse = await api.get(`/restaurantes/${id}/menu`);
        
        // Datos de muestra para pruebas
        const mockRestaurant = {
          id: id,
          nombre: 'Burger House',
          categorias: ['Hamburguesas', 'Comida Rápida'],
          calificacion: 4.5,
          tiempoEntrega: '30-45 min',
          precioEnvio: 2000,
          horarios: {
            lunes: '11:00 AM - 10:00 PM',
            martes: '11:00 AM - 10:00 PM',
            miercoles: '11:00 AM - 10:00 PM',
            jueves: '11:00 AM - 10:00 PM',
            viernes: '11:00 AM - 11:00 PM',
            sabado: '11:00 AM - 11:00 PM',
            domingo: '12:00 PM - 9:00 PM'
          },
          direccion: 'Calle 123 #45-67, Centro',
          descripcion: 'Las mejores hamburguesas artesanales de la ciudad. Ingredientes frescos y de calidad en cada preparación.',
          imagen: 'https://via.placeholder.com/800x300?text=Burger+House'
        };
        
        const mockMenu = [
          {
            categoria: 'Hamburguesas',
            productos: [
              {
                id: '1',
                nombre: 'Hamburguesa Clásica',
                descripcion: 'Carne de res, queso cheddar, lechuga, tomate, cebolla y nuestra salsa especial',
                precio: 12000,
                imagen: 'https://via.placeholder.com/100?text=Clásica'
              },
              {
                id: '2',
                nombre: 'Hamburguesa BBQ',
                descripcion: 'Carne de res, queso, tocineta, cebolla caramelizada y salsa BBQ',
                precio: 15000,
                imagen: 'https://via.placeholder.com/100?text=BBQ'
              },
              {
                id: '3',
                nombre: 'Hamburguesa Mexicana',
                descripcion: 'Carne de res, guacamole, jalapeños, queso, nachos y salsa picante',
                precio: 16000,
                imagen: 'https://via.placeholder.com/100?text=Mexicana'
              }
            ]
          },
          {
            categoria: 'Acompañamientos',
            productos: [
              {
                id: '4',
                nombre: 'Papas Fritas',
                descripcion: 'Papas fritas crujientes con sal marina',
                precio: 5000,
                imagen: 'https://via.placeholder.com/100?text=Papas'
              },
              {
                id: '5',
                nombre: 'Aros de Cebolla',
                descripcion: 'Aros de cebolla crujientes con salsa ranch',
                precio: 6000,
                imagen: 'https://via.placeholder.com/100?text=Aros'
              }
            ]
          },
          {
            categoria: 'Bebidas',
            productos: [
              {
                id: '6',
                nombre: 'Gaseosa',
                descripcion: 'Varias opciones disponibles',
                precio: 3000,
                imagen: 'https://via.placeholder.com/100?text=Gaseosa'
              },
              {
                id: '7',
                nombre: 'Limonada Natural',
                descripcion: 'Limón recién exprimido con azúcar',
                precio: 4000,
                imagen: 'https://via.placeholder.com/100?text=Limonada'
              }
            ]
          }
        ];
        
        setRestaurant(mockRestaurant);
        setMenu(mockMenu);
        
        // Verificar si es favorito
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        setIsFavorite(favorites.includes(id));
        
      } catch (err) {
        console.error('Error al cargar restaurante:', err);
        setError('No se pudo cargar la información del restaurante. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRestaurantData();
  }, [id]);
  
  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter(favId => favId !== id);
    } else {
      newFavorites = [...favorites, id];
    }
    
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };
  
  if (loading) {
    return <div className="loading-container">Cargando restaurante...</div>;
  }
  
  if (error) {
    return <div className="error-container">{error}</div>;
  }
  
  if (!restaurant) {
    return <div className="error-container">No se encontró el restaurante.</div>;
  }
  
  return (
    <div className="restaurant-details">
      <div className="back-button" onClick={() => navigate(-1)}>
        ← Volver
      </div>
      
      <img 
        src={restaurant.imagen} 
        alt={restaurant.nombre} 
        className="restaurant-cover" 
      />
      
      <div className="restaurant-header">
        <div className="restaurant-info">
          <h1 className="restaurant-name">{restaurant.nombre}</h1>
          
          <div className="restaurant-categories">
            {restaurant.categorias.map((category, index) => (
              <span key={index} className="category-tag">{category}</span>
            ))}
          </div>
          
          <div className="restaurant-meta">
            <div className="meta-item">
              <span className="meta-icon">⭐</span>
              <span>{restaurant.calificacion}</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">🕒</span>
              <span>{restaurant.tiempoEntrega}</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">🚚</span>
              <span>${restaurant.precioEnvio.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <button 
          className={`favorite-button ${isFavorite ? 'active' : ''}`}
          onClick={toggleFavorite}
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>
      
      <div className="tabs-container">
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            Menú
          </div>
          <div 
            className={`tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Información
          </div>
        </div>
      </div>
      
      {activeTab === 'menu' ? (
        // Pestaña de menú
        <div className="menu-tab">
          {menu.map((section, index) => (
            <div className="menu-section" key={index}>
              <h2 className="section-title">{section.categoria}</h2>
              
              <div className="menu-list">
                {section.productos.map(product => (
                  <div 
                    className="menu-item" 
                    key={product.id}
                    onClick={() => navigate(`/cliente/producto/${product.id}`)}
                  >
                    <img 
                      src={product.imagen} 
                      alt={product.nombre} 
                      className="item-image" 
                    />
                    
                    <div className="item-details">
                      <h3 className="item-name">{product.nombre}</h3>
                      <p className="item-description">{product.descripcion}</p>
                      <div className="item-price">${product.precio.toLocaleString()}</div>
                    </div>
                    
                    <button className="add-button">+</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Pestaña de información
        <div className="restaurant-info-tab">
          <div className="info-block">
            <h3 className="info-title">Acerca de</h3>
            <p className="info-content">{restaurant.descripcion}</p>
          </div>
          
          <div className="info-block">
            <h3 className="info-title">Horarios</h3>
            <div className="schedule-list">
              <div className="schedule-item">
                <span className="day">Lunes</span>
                <span className="hours">{restaurant.horarios.lunes}</span>
              </div>
              <div className="schedule-item">
                <span className="day">Martes</span>
                <span className="hours">{restaurant.horarios.martes}</span>
              </div>
              <div className="schedule-item">
                <span className="day">Miércoles</span>
                <span className="hours">{restaurant.horarios.miercoles}</span>
              </div>
              <div className="schedule-item">
                <span className="day">Jueves</span>
                <span className="hours">{restaurant.horarios.jueves}</span>
              </div>
              <div className="schedule-item">
                <span className="day">Viernes</span>
                <span className="hours">{restaurant.horarios.viernes}</span>
              </div>
              <div className="schedule-item">
                <span className="day">Sábado</span>
                <span className="hours">{restaurant.horarios.sabado}</span>
              </div>
              <div className="schedule-item">
                <span className="day">Domingo</span>
                <span className="hours">{restaurant.horarios.domingo}</span>
              </div>
            </div>
          </div>
          
          <div className="info-block">
            <h3 className="info-title">Ubicación</h3>
            <p className="info-content">{restaurant.direccion}</p>
            <div className="map-container">
              {/* Aquí iría un mapa real con la ubicación */}
              <div style={{ 
                backgroundColor: '#f0f0f0', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                Mapa de ubicación
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RestaurantDetails;