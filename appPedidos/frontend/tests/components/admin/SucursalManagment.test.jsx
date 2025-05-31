import React from 'react';
import {act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SucursalesManagement from '../../../src/components/admin/SucursalesManagement';
import { api } from '../../../src/services/api';

jest.mock('../../../src/services/api');

describe('SucursalesManagement Component', () => {
  const mockRestaurante = {
    id: '1',
    nombre: 'Test Restaurant'
  };

  const mockSucursales = [
    {
      id: '1',
      nombre: 'Sede Principal',
      direccion: 'Calle 123',
      comuna: 'Comuna 1'
    },
    {
      id: '2',
      nombre: 'Sede Norte',
      direccion: 'Carrera 456',
      comuna: 'Comuna 2'
    }
  ];

  const mockOnClose = jest.fn();

  beforeEach(() => {
    api.get.mockResolvedValue({ data: mockSucursales });
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <SucursalesManagement
        restaurante={mockRestaurante}
        onClose={mockOnClose}
      />
    );
  };

  test('renders modal with restaurant name', async () => {
    renderComponent();
    
    expect(screen.getByText('Gestión de Sucursales')).toBeInTheDocument();
    expect(screen.getByText('Restaurante: Test Restaurant')).toBeInTheDocument();
  });

  test('loads and displays sucursales', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Sede Principal')).toBeInTheDocument();
      expect(screen.getByText('Sede Norte')).toBeInTheDocument();
      expect(screen.getByText('Calle 123')).toBeInTheDocument();
      expect(screen.getByText('Comuna: Comuna 1')).toBeInTheDocument();
    });
  });

  test('opens new sucursal form', async () => {
    renderComponent();
    
    const addButton = screen.getByRole('button', { name: '' }); 
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Nueva Sucursal')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/nombre de la sucursal/i)).toBeInTheDocument();
    });
  });

  test('creates new sucursal', async () => {
    api.post.mockResolvedValue({ data: { id: '3', nombre: 'Nueva Sede' } });
    renderComponent();
    
    const addButton = screen.getByRole('button', { name: '' });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Nueva Sucursal')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/nombre de la sucursal/i), {
      target: { value: 'Nueva Sede' }
    });
    fireEvent.change(screen.getByPlaceholderText(/dirección/i), {
      target: { value: 'Nueva Dirección' }
    });
    fireEvent.change(screen.getByPlaceholderText(/comuna/i), {
      target: { value: 'Nueva Comuna' }
    });
    
    const createButton = screen.getByRole('button', { name: /crear sucursal/i });
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/restaurantes/sucursales', {
        nombre: 'Nueva Sede',
        direccion: 'Nueva Dirección',
        comuna: 'Nueva Comuna',
        restaurante_Id: '1'
      });
    });
  });

  test('edits existing sucursal', async () => {
    api.put.mockResolvedValue({ data: { success: true } });
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Sede Principal')).toBeInTheDocument();
    });
    
    const editButtons = screen.getAllByTitle(/editar sucursal/i);
    fireEvent.click(editButtons[0]);
    
    const nameInput = screen.getByDisplayValue('Sede Principal');
    fireEvent.change(nameInput, { target: { value: 'Sede Principal Editada' } });

    const saveButton = screen.getByTitle(/guardar cambios/i);
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/restaurantes/sucursales/1', {
        nombre: 'Sede Principal Editada',
        direccion: 'Calle 123',
        comuna: 'Comuna 1'
      });
    });
  });

  test('deletes sucursal with confirmation', async () => {
    api.delete.mockResolvedValue({});
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Sede Principal')).toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByTitle(/eliminar sucursal/i);
    fireEvent.click(deleteButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText(/confirmar eliminación/i)).toBeInTheDocument();
    });
    
    const confirmButton = screen.getByRole('button', { name: /sí, eliminar/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/restaurantes/sucursales/1');
    });
  });

  test('closes modal when close button is clicked', () => {
    renderComponent();
    
    const closeButton = screen.getByRole('button', { name: '×' });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows validation error for empty fields', async () => {
    renderComponent();
    
    const addButton = screen.getByRole('button', { name: '' });
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Nueva Sucursal')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /crear sucursal/i });
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText(/el nombre de la sucursal es obligatorio/i)).toBeInTheDocument();
    });
  });
});
