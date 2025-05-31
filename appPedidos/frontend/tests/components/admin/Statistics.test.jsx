import React from 'react';
import {act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Statistics from '../../../src/components/admin/statistics/Statistics';
import { api } from '../../../src/services/api';

jest.mock('../../../src/services/api');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Statistics Component', () => {
  const mockRestaurants = [
    { id: '1', nombre: 'Restaurant 1' },
    { id: '2', nombre: 'Restaurant 2' }
  ];

  const mockStats = {
    totalPedidos: 50,
    totalIngresos: 1250000,
    promedioCalificacion: 4.2,
    totalCalificaciones: 25,
    pedidosPendientes: 5,
    pedidosEnCamino: 8,
    pedidosEntregados: 35,
    pedidosCancelados: 2,
    topProductos: [
      { id: '1', nombre: 'Pizza Margherita', cantidad: 15, ingresos: 375000 },
      { id: '2', nombre: 'Hamburguesa', cantidad: 12, ingresos: 216000 }
    ],
    calificacionesRecientes: [
      {
        calificacion: 5,
        comentarios: 'Excelente servicio',
        fecha: '2024-01-15T10:00:00Z'
      }
    ]
  };

  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url.includes('/restaurantes/mine')) {
        return Promise.resolve({ data: mockRestaurants });
      }
      if (url.includes('/estadisticas')) {
        return Promise.resolve({ data: mockStats });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Statistics />
      </BrowserRouter>
    );
  };

  test('renders statistics page correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Estadísticas')).toBeInTheDocument();
      expect(screen.getByLabelText(/restaurante/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/periodo/i)).toBeInTheDocument();
    });
  });

  test('displays restaurant and period selectors', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Restaurant 1')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/último mes/i)).toBeInTheDocument();
    });
  });

  test('shows statistics overview', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Total de Pedidos')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('Ingresos Totales')).toBeInTheDocument();
      expect(screen.getByText('Calificación Promedio')).toBeInTheDocument();
      expect(screen.getByText('4.2')).toBeInTheDocument();
    });
  });

  test('displays order status breakdown', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Estado de Pedidos')).toBeInTheDocument();
      expect(screen.getByText('Pendientes')).toBeInTheDocument();
      expect(screen.getByText('En Camino')).toBeInTheDocument();
      expect(screen.getByText('Entregados')).toBeInTheDocument();
      expect(screen.getByText('Cancelados')).toBeInTheDocument();
    });
  });

  test('shows top products table', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Productos Más Vendidos')).toBeInTheDocument();
      expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
      expect(screen.getByText('Hamburguesa')).toBeInTheDocument();
    });
  });

  test('displays ratings section', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Calificaciones del Restaurante')).toBeInTheDocument();
      expect(screen.getByText('(25 calificaciones)')).toBeInTheDocument();
      expect(screen.getByText('Calificaciones Recientes')).toBeInTheDocument();
      expect(screen.getByText('"Excelente servicio"')).toBeInTheDocument();
    });
  });

  test('changes restaurant selection', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Restaurant 1')).toBeInTheDocument();
    });
    
    const restaurantSelect = screen.getByLabelText(/restaurante/i);
    fireEvent.change(restaurantSelect, { target: { value: '2' } });
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('/restaurante/2/estadisticas')
      );
    });
  });

  test('changes period selection', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByDisplayValue(/último mes/i)).toBeInTheDocument();
    });
    
    const periodSelect = screen.getByLabelText(/periodo/i);
    fireEvent.change(periodSelect, { target: { value: 'semana' } });
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        expect.stringContaining('periodo=semana')
      );
    });
  });

  test('navigates to restaurant view', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Ver Restaurante')).toBeInTheDocument();
    });
    
    const viewButton = screen.getByText('Ver Restaurante');
    fireEvent.click(viewButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/admin/restaurantes/1');
  });

  test('shows empty state when no restaurants', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/restaurantes/mine')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/no tienes restaurantes/i)).toBeInTheDocument();
      expect(screen.getByText(/crear restaurante/i)).toBeInTheDocument();
    });
  });

  test('handles statistics loading error', async () => {
    api.get.mockImplementation((url) => {
      if (url.includes('/restaurantes/mine')) {
        return Promise.resolve({ data: mockRestaurants });
      }
      if (url.includes('/estadisticas')) {
        return Promise.reject(new Error('Statistics error'));
      }
      return Promise.reject(new Error('Not found'));
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/no se pudieron cargar las estadísticas/i)).toBeInTheDocument();
    });
  });
});
