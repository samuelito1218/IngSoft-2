// src/components/client/ExploreMenu.jssx
import React from 'react';
import '../../styles/ExploreMenu.css';
import { 
  FaUtensils, FaPizzaSlice, FaHamburger, FaCoffee, 
  FaFish, FaCarrot, FaIceCream, FaGlassCheers, FaFire,
  FaBirthdayCake, FaDrumstickBite, FaSeedling
} from 'react-icons/fa';

const ExploreMenu = ({ categories = [], selectedCategory = 'All', onCategoryChange }) => {
  // Iconos para categorías comunes
  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'all':
      case 'todos':
        return <FaUtensils />;
      case 'pizza':
      case 'pizzas':
        return <FaPizzaSlice />;
      case 'hamburguesas':
      case 'hamburguesa':
      case 'burger':
      case 'burgers':
        return <FaHamburger />;
      case 'café':
      case 'cafe':
      case 'cafetería':
      case 'cafeteria':
        return <FaCoffee />;
      case 'mariscos':
      case 'pescado':
      case 'seafood':
        return <FaFish />;
      case 'vegetariano':
      case 'vegano':
      case 'vegetarian':
      case 'vegan':
        return <FaCarrot />;
      case 'postres':
      case 'desserts':
        return <FaIceCream />;
      case 'bebidas':
      case 'drinks':
        return <FaGlassCheers />;
      case 'comida rápida':
      case 'fast food':
        return <FaFire />;
      case 'pasteles':
      case 'cakes':
        return <FaBirthdayCake />;
      case 'carnes':
      case 'meats':
        return <FaDrumstickBite />;
      case 'ensaladas':
      case 'salads':
        return <FaSeedling />;
      default:
        return <FaFire />;
    }
  };
  
  const handleCategoryClick = (category) => {
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };
  
  // Si no hay categorías, mostrar categorías por defecto
  const displayCategories = categories.length > 0 
    ? categories 
    : ['All', 'Pizza', 'Hamburguesas', 'Café', 'Mariscos', 'Vegetariano'];
  
  return (
    <div className="explore-menu">
      <div className="explore-title">
        <h2>Explora Categorías</h2>
      </div>
      
      <div className="categories-list">
        {displayCategories.map((category, index) => (
          <div 
            key={index}
            className={`category-item ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category)}
          >
            <div className="category-icon">
              {getCategoryIcon(category)}
            </div>
            <span className="category-name">{category}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExploreMenu;