// frontend/admin/MisRestaurantes.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import './MisRestaurantes.css'
import CartProvider from '../../contexts/CartContext';

export default function MisRestaurantes() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState(null);

  useEffect(() => {
    setRestaurants(null);
    api
      .get('/restaurantes/mine', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setRestaurants(res.data))
      .catch(err => {
        console.error(err);
        setRestaurants([]);
      });
  }, [token]);

  if (restaurants === null) {
    return (
      <div className="text-center py-10">
        <p className="text-lg">Cargando tus restaurantes…</p>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">Aún no tienes restaurantes creados.</p>
        <Link
           to="nuevo"
           className="empty-state-btn"
         >
           Crear Restaurante
         </Link>
      </div>
    );
  }

  return (
    <div className="restaurants-container">
      <h2 className="restaurants-title">Mis Restaurantes</h2>
      <div className="restaurants-grid">
        {restaurants.map(r => (
          <div
            key={r.id}
            className="restaurant-card"
          >
            {r.imageUrl && <img src={r.imageUrl} alt={r.nombre} />}
            <div className="restaurant-card-content">
              <h3 className="restaurant-card-title">{r.nombre}</h3>
              <p className="restaurant-card-desc">{r.descripcion}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
