import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../../../src/components/admin/dashboard/AdminDashboard';
import { api } from '../../../src/services/api';

jest.mock('../../../src/services/api');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user1', nombre: 'Test User' },
    token: 'mock-token',
    isAuthenticated: true,
    loading: false
  })
}));

jest.mock('react-icons/fa', () => ({
  FaStore: () => <div data-testid="store-icon">Store</div>,
  FaUtensils: () => <div data-testid="utensils-icon">Utensils</div>,
  FaClipboardList: () => <div data-testid="clipboard-icon">Clipboard</div>,
  FaMoneyBillWave: () => <div data-testid="money-icon">Money</div>,
  FaStar: () => <div data-testid="star-icon">Star</div>,
  FaPlus: () => <div data-testid="plus-icon">Plus</div>,
  FaChartLine: () => <div data-testid="chart-icon">Chart</div>,
  FaBell: () => <div data-testid="bell-icon">Bell</div>,
  FaShoppingCart: () => <div data-testid="cart-icon">Cart</div>
}));

jest.mock('../../../src/components/admin/restaurant/RestaurantCard', () => {
  return function MockRestaurantCard({ restaurant, onClick }) {
    return (
      <div 
        data-testid={`restaurant-card-${restaurant.id}`}
        onClick={onClick}
      >
        <h3>{restaurant.nombre}</h3>
        <p>{restaurant.descripcion}</p>
      </div>
    );
  };
});

describe('AdminDashboard Component', () => {
  const mockRestaurants = [
    { 
      id: '1', 
      nombre: 'Restaurant 1', 
      descripcion: 'Description 1' 
    }
  ];

  const mockOrders = [
    {
      id: 'order-1-test',
      estado: 'Pendiente',
      total: 25000,
      fechaDeCreacion: '2024-01-15T10:00:00Z',
      cliente: { nombreCompleto: 'Juan Pérez' },
      direccionEntrega: {
        direccionEspecifica: 'Calle 123',
        barrio: 'Centro',
        comuna: '1'
      }
    }
  ];

  const mockCalificaciones = {
    restaurante: {
      calificacionPromedio: 4.5,
      totalCalificaciones: 10
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    api.get.mockImplementation((url) => {
      if (url.includes('/restaurantes/mine') || url.includes('/restaurantes/mis-restaurantes')) {
        return Promise.resolve({ data: mockRestaurants });
      }
      if (url.includes('/restaurantes/1/productos')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/pedidos/restaurante/1')) {
        return Promise.resolve({ data: mockOrders });
      }
      if (url.includes('/calificaciones/restaurante/1')) {
        return Promise.resolve({ data: mockCalificaciones });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  const renderComponent = async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <AdminDashboard />
        </BrowserRouter>
      );
    });
  };

  test('renders dashboard with statistics', async () => {
    await renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard de Administración')).toBeInTheDocument();
    }, { timeout: 10000 });

    await waitFor(() => {
      expect(screen.getByText('Total Productos')).toBeInTheDocument();
      expect(screen.getByText('Pedidos Pendientes')).toBeInTheDocument();
      expect(screen.getByText('Total Pedidos')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  test('displays restaurant selector when restaurants exist', async () => {
    await renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Restaurante:')).toBeInTheDocument();
    }, { timeout: 10000 });

    await waitFor(() => {
      const select = screen.getByLabelText('Restaurante:');
      expect(select).toBeInTheDocument();
      expect(select.value).toBe('1');
    }, { timeout: 10000 });
  });

  test('displays recent orders', async () => {
    await renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Pedidos Recientes')).toBeInTheDocument();
    }, { timeout: 10000 });

    await waitFor(() => {
      expect(
        screen.getByText((content, element) =>
          element?.tagName.toLowerCase() === 'h4' &&
          element.textContent.replace(/\s+/g, '').includes('Pedido#order-1-')
        )
      ).toBeInTheDocument();
      
      expect(
        screen.getByText(/Juan\s*Pérez/)
      ).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  test('displays empty state when no restaurants', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/restaurantes/mine') || url.includes('/restaurantes/mis-restaurantes')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });

    await renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('No tienes restaurantes')).toBeInTheDocument();
      expect(screen.getByText(/crear mi primer restaurante/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  test('handles navigation to create restaurant', async () => {
    await renderComponent();
    
    await waitFor(() => {
      const createButton = screen.getByText(/crear restaurante/i);
      expect(createButton).toBeInTheDocument();
    }, { timeout: 10000 });

    await act(async () => {
      const createButton = screen.getByText(/crear restaurante/i);
      fireEvent.click(createButton);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/admin/restaurantes/nuevo');
  });

  test('shows quick actions', async () => {
    await renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Acciones Rápidas')).toBeInTheDocument();
      expect(screen.getByText('Gestionar Productos')).toBeInTheDocument();
      expect(screen.getByText('Ver Pedidos')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  test('displays restaurant cards', async () => {
    await renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('restaurant-card-1')).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});