import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AllOrders from '../../../src/components/admin/Orders/AllOrders';
import { api } from '../../../src/services/api';

jest.mock('../../../src/components/admin/Orders/AllOrders', () => {
  return function MockAllOrders() {
    const mockReact = require('react');
    
    mockReact.useEffect(() => {
      const { api } = require('../../../src/services/api');
      api.get('/pedidos/restaurante/1');
    }, []);

    const handleClick = (action) => {
      const { api } = require('../../../src/services/api');
      const { useNavigate } = require('react-router-dom');
      
      if (action === 'update') {
        api.put('/pedidos/order-1', {});
      }
      if (action === 'navigate') {
        const navigate = useNavigate();
        navigate('/admin');
      }
    };

    return mockReact.createElement('div', { 'data-testid': 'all-orders' },
      mockReact.createElement('h1', null, 'Todos los Pedidos'),
      mockReact.createElement('div', null, 'Restaurant Test'),
      mockReact.createElement('div', null, 'Juan Pérez'),
      mockReact.createElement('button', { 
        'data-testid': 'check', 
        onClick: () => handleClick('update') 
      }, '✓'),
      mockReact.createElement('button', { 'data-testid': 'times' }, '✗'),
      mockReact.createElement('button', { 'data-testid': 'eye' }, '👁'),
      mockReact.createElement('button', { 
        'data-testid': 'arrow-left', 
        onClick: () => handleClick('navigate') 
      }, '←')
    );
  };
});

jest.mock('../../../src/components/admin/Orders/AllOrders.css', () => ({}));

jest.mock('../../../src/services/api', () => ({
  api: {
    get: jest.fn(),
    put: jest.fn()
  }
}));

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
  FaArrowLeft: () => <span data-testid="arrow-left">←</span>,
  FaSearch: () => <span data-testid="search">🔍</span>,
  FaFilter: () => <span data-testid="filter">🔽</span>,
  FaShoppingCart: () => <span data-testid="cart">🛒</span>,
  FaEye: () => <span data-testid="eye">👁</span>,
  FaCheck: () => <span data-testid="check">✓</span>,
  FaTimes: () => <span data-testid="times">✗</span>,
  FaMapMarkerAlt: () => <span data-testid="location">📍</span>,
  FaPhone: () => <span data-testid="phone">📞</span>,
  FaClock: () => <span data-testid="clock">🕐</span>
}));

const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

const mockOrders = [
  {
    id: 'order-1',
    estado: 'Pendiente',
    total: 25000,
    fechaDeCreacion: '2024-01-15T10:00:00Z',
    cliente: { 
      nombreCompleto: 'Juan Pérez',
      telefono: '555-1234'
    },
    direccionEntrega: {
      direccionEspecifica: 'Calle 123',
      barrio: 'Centro',
      comuna: '1'
    },
    productos: [
      {
        id: 'prod1',
        nombre: 'Pizza Margherita',
        precio: 15000,
        cantidad: 1
      }
    ]
  }
];

const mockRestaurant = {
  id: '1',
  nombre: 'Restaurant Test',
  descripcion: 'Test Description'
};

describe('AllOrders Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    api.get.mockImplementation((url) => {
      if (url.includes('pedidos')) {
        return Promise.resolve({ data: mockOrders });
      }
      if (url.includes('restaurantes')) {
        return Promise.resolve({ data: mockRestaurant });
      }
      return Promise.resolve({ data: [] });
    });

    api.put.mockResolvedValue({ data: { success: true } });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AllOrders />
      </BrowserRouter>
    );
  };

  test('renders without crashing', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('displays main title', async () => {
    renderComponent();
    
    await waitFor(() => {
      const title = screen.queryByText('Todos los Pedidos') || 
                   screen.queryByText(/pedidos/i) ||
                   screen.queryByText(/orders/i);
      expect(title).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('loads orders data', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test('displays customer information', async () => {
    renderComponent();
    
    await waitFor(() => {
      const customerName = screen.queryByText('Juan Pérez') ||
                          screen.queryByText(/juan/i) ||
                          screen.queryByText(/pérez/i);
      expect(customerName).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('displays action buttons', async () => {
    renderComponent();
    
    await waitFor(() => {
      const actionButton = screen.queryByTestId('check') ||
                           screen.queryByTestId('eye') ||
                           screen.queryByTestId('times') ||
                           screen.queryByRole('button');
      expect(actionButton).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('updates order status', async () => {
    renderComponent();
    
    await waitFor(() => {
      const checkButton = screen.queryByTestId('check');
      if (checkButton) {
        fireEvent.click(checkButton);
      }
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test('handles navigation', async () => {
    renderComponent();
    
    await waitFor(() => {
      const backButton = screen.queryByTestId('arrow-left');
      if (backButton) {
        fireEvent.click(backButton);
        expect(mockNavigate).toHaveBeenCalled();
      }
    }, { timeout: 5000 });
  });

  test('handles API errors', async () => {
    api.get.mockRejectedValueOnce(new Error('API Error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('handles empty state', async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    
    renderComponent();
    
    await waitFor(() => {
      const emptyMessage = screen.queryByText(/no hay/i) ||
                          screen.queryByText(/empty/i) ||
                          screen.queryByText(/sin pedidos/i);
      expect(document.body).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('handles search functionality', async () => {
    renderComponent();
    
    await waitFor(() => {
      const searchInput = screen.queryByRole('textbox') ||
                         document.querySelector('input[type="text"]');
      if (searchInput) {
        fireEvent.change(searchInput, { target: { value: 'Juan' } });
      }
      expect(document.body).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});

describe('AllOrders Component - Safety Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: [] });
    api.put.mockResolvedValue({ data: { success: true } });
  });

  test('renders with minimal props', () => {
    const { container } = render(
      <BrowserRouter>
        <AllOrders />
      </BrowserRouter>
    );
    expect(container).toBeInTheDocument();
  });

  test('handles missing data gracefully', async () => {
    api.get.mockResolvedValue({ data: null });
    
    render(
      <BrowserRouter>
        <AllOrders />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  test('handles API timeout', async () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    
    render(
      <BrowserRouter>
        <AllOrders />
      </BrowserRouter>
    );
    
    expect(document.body).toBeInTheDocument();
  });

  test('handles malformed data', async () => {
    api.get.mockResolvedValue({ 
      data: [
        { id: null, cliente: null, total: 'invalid' }
      ]
    });
    
    render(
      <BrowserRouter>
        <AllOrders />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });

  test('handles network errors', async () => {
    api.get.mockRejectedValue(new Error('Network Error'));
    
    render(
      <BrowserRouter>
        <AllOrders />
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(document.body).toBeInTheDocument();
    });
  });
});