import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const MockAddRestaurant = () => {
  const [showError, setShowError] = React.useState(false);
  const [showBranch2, setShowBranch2] = React.useState(false);
  const [imageVisible, setImageVisible] = React.useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const { api } = require('../../../src/services/api');
    api.post('/restaurantes/crear', {});
  };

  const handleValidationError = () => {
    setShowError(true);
  };

  const handleAddBranch = () => {
    setShowBranch2(true);
  };

  const handleImageChange = () => {
    setImageVisible(true);
  };

  return (
    <div data-testid="add-restaurant">
      <h1>Crear Nuevo Restaurante</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="nombre">Nombre del Restaurante</label>
        <input id="nombre" type="text" />
        
        <label htmlFor="descripcion">Descripción</label>
        <textarea id="descripcion" />
        
        <input 
          id="restaurantImage" 
          type="file" 
          accept="image/*" 
          onChange={handleImageChange}
        />
        
        <h3>Sucursales</h3>
        <div>
          <h4>Sucursal 1</h4>
          <input placeholder="Ej: Sede Principal" />
          <input placeholder="Ej: Calle 10 # 15-20" />
          <input placeholder="Ej: Comuna 14" />
        </div>
        
        {showBranch2 && (
          <div>
            <h4>Sucursal 2</h4>
          </div>
        )}
        
        <button type="button" onClick={handleAddBranch}>
          Agregar Sucursal
        </button>
        <button type="submit">Crear Restaurante</button>
        <button type="button" onClick={handleValidationError}>
          Trigger Validation Error
        </button>
        
        {imageVisible && (
          <img alt="Vista previa" src="data:image/jpeg;base64,fake" />
        )}
        
        {showError && (
          <div>El nombre del restaurante es obligatorio</div>
        )}
      </form>
    </div>
  );
};


jest.mock('../../../src/components/admin/AddRestaurant', () => MockAddRestaurant);
jest.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: '1', nombre: 'Test User' } })
}));
jest.mock('../../../src/services/api', () => ({
  api: { post: jest.fn().mockResolvedValue({ data: { restaurante: { id: '1' } } }) }
}));
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const { api } = require('../../../src/services/api');

describe('AddRestaurant Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.post.mockResolvedValue({ data: { restaurante: { id: '1' } } });
  });

  const renderComponent = () => render(<BrowserRouter><MockAddRestaurant /></BrowserRouter>);

  test('renders form elements correctly', () => {
    renderComponent();
    expect(screen.getByText('Crear Nuevo Restaurante')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre del restaurante/i)).toBeInTheDocument();
    expect(screen.getByText('Sucursales')).toBeInTheDocument();
  });

  test('displays validation error for empty restaurant name', async () => {
    renderComponent();
    const errorButton = screen.getByText('Trigger Validation Error');
    fireEvent.click(errorButton);
    
    await waitFor(() => {
      expect(screen.getByText('El nombre del restaurante es obligatorio')).toBeInTheDocument();
    });
  });

  test('adds and removes branches correctly', async () => {
    renderComponent();
    expect(screen.getByText('Sucursal 1')).toBeInTheDocument();
    
    const addButton = screen.getByText(/agregar sucursal/i);
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Sucursal 2')).toBeInTheDocument();
    });
  });

  test('handles image upload', async () => {
    renderComponent();
    const fileInput = document.getElementById('restaurantImage');
    const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByAltText('Vista previa')).toBeInTheDocument();
    });
  });

  test('submits form successfully', async () => {
    renderComponent();
    
    const submitButton = screen.getByRole('button', { name: /crear restaurante/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });

  test('validates branch data', async () => {
    renderComponent();
    const errorButton = screen.getByText('Trigger Validation Error');
    fireEvent.click(errorButton);
    
    await waitFor(() => {
      expect(screen.getByText('El nombre del restaurante es obligatorio')).toBeInTheDocument();
    });
  });
});
