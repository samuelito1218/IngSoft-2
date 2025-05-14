// frontend/layouts/Admin.jsx
import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/admin.css'

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleCloseDashboard = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Panel Admin</h2>
        <nav className="nav-links">
        <NavLink
        to="restaurantes"
        end                           // <-- exact match
        className={({ isActive }) => (isActive ? 'active' : '')}
      >
        Mis Restaurantes
      </NavLink>
      <NavLink
          to="restaurantes/nuevo"
          end                           // <-- exact match también
          className={({ isActive }) => (isActive ? 'active' : '')}
        >
          Agregar Restaurante
        </NavLink>
        </nav>

        {/* Botón para cerrar el dashboard */}
        <button
          onClick={handleCloseDashboard}
          className="close-btn"
        >
          Cerrar Dashboard
        </button>
      </aside>

      {/* Main Content */}
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}