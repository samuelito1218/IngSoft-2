import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/ClientHome.css';

function ClientHome() {
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Por ahora, usemos datos de muestra en lugar de hacer llamadas a la API
        // hasta que el backend esté listo
        
        // Datos de muestra para categorías
        const sampleCategories = [
          { id: 1, name: 'Hamburguesas' },
          { id: 2, name: 'Pizza' },
          { id: 3, name: 'Sushi' },
          { id: 4, name: 'Postres' },
          { id: 5, name: 'Saludable' },
          { id: 6, name: 'Bebidas' }
        ];

        // Datos de muestra para restaurantes
        const sampleRestaurants = [
          { id: 1, name: 'Burger Place', category: 'Hamburguesas', rating: 4.5, deliveryTime: 30, imageUrl: '' },
          { id: 2, name: 'Pizza Heaven', category: 'Pizza', rating: 4.2, deliveryTime: 40, imageUrl: '' },
          { id: 3, name: 'Sushi World', category: 'Sushi', rating: 4.8, deliveryTime: 45, imageUrl: '' },
          { id: 4, name: 'Sweet Tooth', category: 'Postres', rating: 4.3, deliveryTime: 25, imageUrl: '' }
        ];

        setCategories(sampleCategories);
        setRestaurants(sampleRestaurants);
        setError(null);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('No se pudieron cargar los datos. Por favor, intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Función auxiliar para obtener iconos según la categoría
  const getCategoryIcon = (categoryName) => {
    const icons = {
      'Hamburguesas': '🍔',
      'Pizza': '🍕',
      'Sushi': '🍣',
      'Postres': '🍰',
      'Saludable': '🥗',
      'Bebidas': '🥤'
    };
    
    return icons[categoryName] || '🍽️';
  };

  if (loading) {
    return <div className="loading-container">Cargando...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="client-home">
      {/* Banner de bienvenida */}
      <div className="welcome-banner">
        <div className="banner-content">
          <h1 className="banner-title">¡Bienvenido a FastFood!</h1>
          <p className="banner-text">Los mejores restaurantes a un solo clic de distancia.</p>
        </div>
        <div className="banner-decoration">🍔</div>
      </div>
      
      {/* Sección de categorías */}
      <div className="categories-section">
        <h2 className="section-title">Categorías</h2>
        <div className="categories-grid">
          {categories.map(category => (
            <Link key={category.id} to={`/cliente/categoria/${category.id}`} className="category-card">
              <span className="category-icon">{getCategoryIcon(category.name)}</span>
              <span className="category-name">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Sección de restaurantes */}
      <div className="restaurants-section">
        <h2 className="section-title">Restaurantes populares</h2>
        <div className="restaurants-grid">
          {restaurants.map(restaurant => (
            <Link key={restaurant.id} to={`/cliente/restaurante/${restaurant.id}`} className="restaurant-card">
              <img 
                src={restaurant.imageUrl || "https://via.placeholder.com/300x150?text=Restaurante"}
                alt={restaurant.name} 
                className="restaurant-image" 
              />
              <div className="restaurant-info">
                <h3 className="restaurant-name">{restaurant.name}</h3>
                <p className="restaurant-category">{restaurant.category}</p>
                <div className="restaurant-meta">
                  <span className="restaurant-rating">
                    <span className="rating-icon">⭐</span>
                    {restaurant.rating}
                  </span>
                  <span className="restaurant-delivery">
                    {restaurant.deliveryTime} min
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClientHome;