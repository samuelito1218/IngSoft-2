import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/contexts/AuthContext';

const MockAuthProvider = ({ children, value = {} }) => {
  const defaultValue = {
    user: { id: '1', nombre: 'Test User', email: 'test@example.com' },
    token: 'mock-token',
    isAuthenticated: true,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    ...value
  };

  return (
    <AuthProvider value={defaultValue}>
      {children}
    </AuthProvider>
  );
};

const AllTheProviders = ({ children, authValue = {} }) => {
  return (
    <BrowserRouter>
      <MockAuthProvider value={authValue}>
        {children}
      </MockAuthProvider>
    </BrowserRouter>
  );
};

const customRender = (ui, options = {}) => {
  const { authValue, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: (props) => <AllTheProviders {...props} authValue={authValue} />,
    ...renderOptions
  });
};

export * from '@testing-library/react';

export { customRender as render };

export const mockApiResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {}
});

export const mockApiError = (message = 'API Error', status = 400) => ({
  response: {
    data: { message },
    status,
    statusText: 'Bad Request'
  }
});

export const createMockRestaurant = (overrides = {}) => ({
  id: '1',
  nombre: 'Test Restaurant',
  descripcion: 'Test description',
  imageUrl: 'https://example.com/image.jpg',
  categorias: ['Pizza'],
  ...overrides
});

export const createMockProduct = (overrides = {}) => ({
  id: '1',
  nombre: 'Test Product',
  especificaciones: 'Test specifications',
  precio: 25000,
  categoria: 'Pizza',
  imageUrl: 'https://example.com/product.jpg',
  ...overrides
});

export const createMockOrder = (overrides = {}) => ({
  id: 'order-1',
  estado: 'Pendiente',
  total: 25000,
  fechaDeCreacion: '2024-01-15T10:00:00Z',
  cliente: { nombreCompleto: 'Test Customer' },
  direccionEntrega: {
    direccionEspecifica: 'Test Address',
    barrio: 'Test Neighborhood',
    comuna: '1'
  },
  productos: [
    {
      nombre: 'Test Product',
      cantidad: 1,
      precio: 25000
    }
  ],
  ...overrides
});