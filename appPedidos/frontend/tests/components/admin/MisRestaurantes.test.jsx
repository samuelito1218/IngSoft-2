import React from 'react';
import {act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MisRestaurantes from '../../../src/components/admin/MisRestaurantes';
import { useAuth } from '../../../src/hooks/useAuth';
import { api } from '../../../src/services/api';

jest.mock('../../../src/hooks/useAuth');
jest.mock('../../../src/services/api');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('MisRestaurantes Component', () => {
  const mockRestaurants = [
    {
      id: '1',
      nombre: 'Restaurant 1',
      descripcion: 'Description 1',
      imageUrl: 'https://example.com/image1.jpg',
      categorias: ['Pizza', 'Italiana']
    },
    {
      id: '2',
      nombre: 'Restaurant 2',
      descripcion: 'Description 2',
      categorias: ['Hamburguesa']
    }
  ];

  beforeEach(() => {
    useAuth.mockReturnValue({
      token: 'mock-token'
    });
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <MisRestaurantes />
      </BrowserRouter>
    );
  };

  test('renders loading state initially', () => {
    api.get.mockReturnValue(new Promise(() => {})); // Never resolves
    renderComponent();
    
    expect(screen.getByText(/cargando restaurantes/i)).toBeInTheDocument();
  });

  test('displays restaurants when loaded', async () => {
    api.get.mockResolvedValue({ data: mockRestaurants });
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Restaurant 1')).toBeInTheDocument();
      expect(screen.getByText('Restaurant 2')).toBeInTheDocument();
    });
  });

  test('displays empty state when no restaurants', async () => {
    api.get.mockResolvedValue({ data: [] });
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/no tienes restaurantes/i)).toBeInTheDocument();
      expect(screen.getByText(/crear restaurante/i)).toBeInTheDocument();
    });
  });

  test('handles restaurant deletion', async () => {
    api.get.mockResolvedValue({ data: mockRestaurants });
    api.delete.mockResolvedValue({});
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Restaurant 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle(/eliminar restaurante/i);
    fireEvent.click(deleteButtons[0]);
    

    await waitFor(() => {
      expect(screen.getByText(/confirmar eliminación/i)).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByText("Eliminar");
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/restaurantes/eliminar/1', expect.any(Object));
    });
  });

  test('navigates to edit restaurant', async () => {
    api.get.mockResolvedValue({ data: mockRestaurants });
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Restaurant 1')).toBeInTheDocument();
    });
    
    const editButtons = screen.getAllByTitle(/editar restaurante/i);
    fireEvent.click(editButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/admin/restaurantes/editar/1');
  });

  test('opens sucursales management modal', async () => {
    api.get.mockResolvedValue({ data: mockRestaurants });
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Restaurant 1')).toBeInTheDocument();
    });
    
    const sucursalesButtons = screen.getAllByTitle(/gestionar sucursales/i);
    fireEvent.click(sucursalesButtons[0]);

    expect(sucursalesButtons[0]).toBeInTheDocument();
  });
});