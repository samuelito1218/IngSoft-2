import React from 'react'
import { NavLink, Outlet, useNavigate} from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import '../../styles/admin.css'

export default function AdminLayout() {
    const navigate = useNavigate()
    const { logout } = useAuth()
  
    const handleCloseDashboard = () => {
      // Cerrar sesión y redirigir al login o página principal
      logout()
      navigate('/')
    }
  
    return (
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <h2>Panel Admin</h2>
          <nav>
            <NavLink
              to="restaurantes/nuevo"
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
    )
  }
