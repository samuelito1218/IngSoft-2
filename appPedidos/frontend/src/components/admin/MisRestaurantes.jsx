
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaUtensils, FaExternalLinkAlt, FaStore, FaBuilding } from 'react-icons/fa';
import SucursalesManagement from './SucursalesManagement';

import './MisRestaurantes.css';

export default function MisRestaurantes() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);
  const [mostrarSucursales, setMostrarSucursales] = useState(false); 
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState(null); 

  
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        console.log("Intentando obtener restaurantes del usuario")

        const res = await api.get('/restaurantes/mine');
        console.log("Restaurantes obtenidos:", res.data);

        setRestaurants(res.data || []);
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener restaurantes:", error);
        setError("No se pudieron cargar los restaurantes. Intente nuevamente");
        setRestaurants([]);
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [token]);

  
  const handleEdit = (id) => {
    navigate(`/admin/restaurantes/editar/${id}`);
  };

  
  const handleViewDetails = (id) => {
    navigate(`/admin/restaurantes/${id}`);
  };

  const confirmDelete = (restaurant) => {
    setRestaurantToDelete(restaurant);
    setShowDeleteModal(true);
  };

  
  const handleDelete = async () => {
    if (!restaurantToDelete) return;

    try {
      await api.delete(`/restaurantes/eliminar/${restaurantToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

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

  const handleManageProducts = (id) => {
    navigate(`/admin/productos/${id}`);
  };

  const handleManageSucursales = (restaurant) => {
    setRestauranteSeleccionado(restaurant);
    setMostrarSucursales(true);
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
            <div key={restaurant.id} className="restaurant-card" onClick={() => handleViewDetails(restaurant.id)}>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(restaurant.id);
                  }}
                  title="Editar restaurante"
                >
                  <FaEdit />
                </button>
                <button 
                  className="action-button products" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManageProducts(restaurant.id);
                  }}
                  title="Gestionar productos"
                >
                  <FaUtensils />
                </button>
                
                <button 
                  className="action-button sucursales" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManageSucursales(restaurant);
                  }}
                  title="Gestionar sucursales"
                >
                  <FaBuilding />
                </button>
               
                <button 
                  className="action-button delete" 
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(restaurant);
                  }}
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

    
      {mostrarSucursales && restauranteSeleccionado && (
        <SucursalesManagement
          restaurante={restauranteSeleccionado}
          onClose={() => {
            setMostrarSucursales(false);
            setRestauranteSeleccionado(null);
          }}
        />
      )}
    </div>
  );
}