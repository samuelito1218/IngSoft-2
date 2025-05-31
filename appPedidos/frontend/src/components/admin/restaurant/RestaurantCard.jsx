import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../services/api';
import { FaEdit, FaTrash, FaUtensils, FaExternalLinkAlt, FaStore, FaBuilding } from 'react-icons/fa';
import SucursalesManagement from '../SucursalesManagement';
import './RestaurantCard.css';

const RestaurantCard = ({ restaurant, onRestaurantDeleted, onError }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleViewDetails = () => {
    navigate(`/admin/restaurantes/${restaurant.id}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/admin/restaurantes/editar/${restaurant.id}`);
  };

  // Mostrar modal de confirmación para eliminar
  const confirmDelete = (e) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  // Eliminar restaurante
  const handleDelete = async () => {
    try {
      await api.delete(`/restaurantes/eliminar/${restaurant.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (onRestaurantDeleted) {
        onRestaurantDeleted(restaurant.id);
      }

      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error al eliminar el restaurante:', err);
      if (onError) {
        onError('No se pudo eliminar el restaurante. Por favor, intente de nuevo.');
      }
    }
  };

  // Manejar gestión de productos
  const handleManageProducts = (e) => {
    e.stopPropagation();
    navigate(`/admin/productos/${restaurant.id}`);
  };

  return (
    <>
      <div className="restaurant-card" onClick={handleViewDetails}>
        <div className="restaurant-image">
          {restaurant.imageUrl ? (
            <img src={restaurant.imageUrl} alt={restaurant.nombre} />
          ) : (
            <div className="image-placeholder">
              <FaStore />
            </div>
          )}
        </div>
        
        <div className="restaurant-content">
          <h3>{restaurant.nombre}</h3>
          <p className="restaurant-description">{restaurant.descripcion || 'Sin descripción'}</p>
          {restaurant.categorias && restaurant.categorias.length > 0 && (
            <div className="restaurant-categories">
              {restaurant.categorias.map((cat, idx) => (
                <span key={idx} className="category-tag">{cat}</span>
              ))}
            </div>
          )}
        </div>
        
        <div className="restaurant-actions">
          <button 
            className="action-button edit" 
            onClick={handleEdit}
            title="Editar restaurante"
          >
            <FaEdit />
          </button>
          
          <button 
            className="action-button products" 
            onClick={handleManageProducts}
            title="Gestionar productos"
          >
            <FaUtensils />
          </button>
          
          <button 
            className="action-button delete" 
            onClick={confirmDelete}
            title="Eliminar restaurante"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3>Confirmar Eliminación</h3>
            <p>¿Está seguro que desea eliminar el restaurante <strong>{restaurant.nombre}</strong>?</p>
            <p className="warning-text">Esta acción no se puede deshacer y eliminará también todos los productos asociados.</p>
            <div className="modal-actions">
              <button 
                className="cancel-button" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="delete-button" 
                onClick={handleDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RestaurantCard;