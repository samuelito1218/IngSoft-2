import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaUtensils, FaExternalLinkAlt } from 'react-icons/fa';
import './MisRestaurantes.css';

export default function MisRestaurantes() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);

  // Cargar restaurantes
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const res = await api.get('/restaurantes/mine', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRestaurants(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los restaurantes. Por favor, intente de nuevo.');
        setRestaurants([]);
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [token]);

  // Manejar edición de restaurante
  const handleEdit = (id) => {
    navigate(`/admin/restaurantes/editar/${id}`);
  };

  // Mostrar modal de confirmación para eliminar
  const confirmDelete = (restaurant) => {
    setRestaurantToDelete(restaurant);
    setShowDeleteModal(true);
  };

  // Eliminar restaurante
  const handleDelete = async () => {
    if (!restaurantToDelete) return;

    try {
      await api.delete(`/restaurantes/eliminar/${restaurantToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Actualizar la lista de restaurantes
      setRestaurants(prevRestaurants => 
        prevRestaurants.filter(r => r.id !== restaurantToDelete.id)
      );

      setShowDeleteModal(false);
      setRestaurantToDelete(null);
    } catch (err) {
      console.error('Error al eliminar el restaurante:', err);
      setError('No se pudo eliminar el restaurante. Por favor, intente de nuevo.');
    }
  };

  // Manejar gestión de productos
  const handleManageProducts = (id) => {
    navigate(`/admin/productos/${id}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando restaurantes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="mis-restaurantes-container">
      <div className="section-header">
        <h2>Mis Restaurantes</h2>
        <Link to="/admin/restaurantes/nuevo" className="add-button">
          <FaPlus /> Crear Restaurante
        </Link>
      </div>

      {restaurants && restaurants.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <FaStore />
          </div>
          <h3>No tienes restaurantes</h3>
          <p>Comienza creando tu primer restaurante</p>
          <Link to="/admin/restaurantes/nuevo" className="create-button">
            <FaPlus /> Crear Restaurante
          </Link>
        </div>
      ) : (
        <div className="restaurants-grid">
          {restaurants && restaurants.map(restaurant => (
            <div key={restaurant.id} className="restaurant-card">
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
                  onClick={() => handleEdit(restaurant.id)}
                  title="Editar restaurante"
                >
                  <FaEdit />
                </button>
                <button 
                  className="action-button products" 
                  onClick={() => handleManageProducts(restaurant.id)}
                  title="Gestionar productos"
                >
                  <FaUtensils />
                </button>
                <button 
                  className="action-button view" 
                  onClick={() => window.open(`/cliente/restaurante/${restaurant.id}`, '_blank')}
                  title="Ver como cliente"
                >
                  <FaExternalLinkAlt />
                </button>
                <button 
                  className="action-button delete" 
                  onClick={() => confirmDelete(restaurant)}
                  title="Eliminar restaurante"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3>Confirmar Eliminación</h3>
            <p>¿Está seguro que desea eliminar el restaurante <strong>{restaurantToDelete?.nombre}</strong>?</p>
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
    </div>
  );
}