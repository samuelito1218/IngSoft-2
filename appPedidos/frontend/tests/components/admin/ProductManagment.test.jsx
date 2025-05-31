import React from 'react';
import {act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductManagement from '../../../src/components/admin/productos/ProductManagement';
import { useAuth } from '../../../src/hooks/useAuth';
import { api } from '../../../src/services/api';

jest.mock('../../../src/hooks/useAuth');
jest.mock('../../../src/services/api');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ restaurantId: '1' })
}));

describe('ProductManagement Component', () => {
  const mockRestaurant = {
    id: '1',
    nombre: 'Test Restaurant'
  };

  const mockProducts = [
    {
      id: '1',
      nombre: 'Pizza Margherita',
      especificaciones: 'Deliciosa pizza italiana',
      precio: 25000,
      imageUrl: 'https://example.com/pizza.jpg'
    },
    {
      id: '2',
      nombre: 'Hamburguesa',
      especificaciones: 'Hamburguesa casera',
      precio: 18000
    }
  ];

  beforeEach(() => {
    useAuth.mockReturnValue({
      token: 'mock-token',
      user: { id: '1' },
      isAuthenticated: true,
      loading: false
    });

    api.get.mockImplementation((url) => {
      if (url === '/restaurantes/1') {
        return Promise.resolve({ data: mockRestaurant });
      }
      if (url === '/restaurantes/1/productos') {
        return Promise.resolve({ data: mockProducts });
      }
      return Promise.resolve({ data: [] });
    });

    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ProductManagement />
      </BrowserRouter>
    );
  };

  test('renders products list correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Productos')).toBeInTheDocument();
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
      expect(screen.getByText('Hamburguesa')).toBeInTheDocument();
    });
  });

  test('filters products by search term', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
      expect(screen.getByText('Hamburguesa')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/buscar productos/i);
    fireEvent.change(searchInput, { target: { value: 'pizza' } });
    
    await waitFor(() => {
      expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
      expect(screen.queryByText('Hamburguesa')).not.toBeInTheDocument();
    });
  });

  test('opens add product modal', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Productos')).toBeInTheDocument();
    });
    
    const addButton = screen.getByRole('button', { name: /agregar producto/i });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/nuevo producto/i)).toBeInTheDocument();
    });
  });

  test('opens edit product modal', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
    });
    
    const editButtons = screen.getAllByTitle(/editar producto/i);
    fireEvent.click(editButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText(/editar producto/i)).toBeInTheDocument();
    });
  });

  test('deletes product', async () => {
    api.delete.mockResolvedValue({});
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Pizza Margherita')).toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByTitle(/eliminar producto/i);
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText(/confirmar eliminación/i)).toBeInTheDocument();
    });
    
    const confirmButtons = screen.getAllByRole('button', { name: /eliminar/i });
    const confirmButton = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/productos/1', expect.any(Object));
    });
  });

  test('displays empty state when no products', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/restaurantes/1') {
        return Promise.resolve({ data: mockRestaurant });
      }
      if (url === '/restaurantes/1/productos') {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/no hay productos/i)).toBeInTheDocument();
      expect(screen.getByText(/comienza agregando productos/i)).toBeInTheDocument();
    });
  });
});