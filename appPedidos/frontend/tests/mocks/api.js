export const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn()
};

mockApi.get.mockImplementation((url) => {
  if (url.includes('/restaurantes/mine')) {
    return Promise.resolve({
      data: [
        {
          id: '1',
          nombre: 'Test Restaurant',
          descripcion: 'Test description'
        }
      ]
    });
  }
  
  if (url.includes('/productos')) {
    return Promise.resolve({
      data: [
        {
          id: '1',
          nombre: 'Test Product',
          precio: 25000
        }
      ]
    });
  }
  
  if (url.includes('/pedidos')) {
    return Promise.resolve({
      data: [
        {
          id: 'order-1',
          estado: 'Pendiente',
          total: 25000
        }
      ]
    });
  }
  
  return Promise.resolve({ data: {} });
});

mockApi.post.mockResolvedValue({
  data: { id: '1', message: 'Created successfully' }
});

mockApi.put.mockResolvedValue({
  data: { id: '1', message: 'Updated successfully' }
});

mockApi.delete.mockResolvedValue({
  data: { message: 'Deleted successfully' }
});