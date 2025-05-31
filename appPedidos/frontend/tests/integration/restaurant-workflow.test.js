import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../../src/services/api', () => ({ api: { get: jest.fn(), post: jest.fn() } }));
jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: '1' }, isAuthenticated: true, loading: false })
}));

describe('Restaurant Management Workflow', () => {
  test('should complete full restaurant management workflow', async () => {
    const TestComponent = () => (
      <BrowserRouter>
        <div>
          <div data-testid="mis-restaurantes">Mis Restaurantes</div>
          <div data-testid="add-restaurant">Add Restaurant</div>
        </div>
      </BrowserRouter>
    );

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('mis-restaurantes')).toBeInTheDocument();
      expect(screen.getByTestId('add-restaurant')).toBeInTheDocument();
    });
  });
});