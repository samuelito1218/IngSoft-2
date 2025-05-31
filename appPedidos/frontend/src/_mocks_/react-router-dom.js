const mockNavigate = jest.fn();
const mockUseParams = jest.fn(() => ({}));
const mockUseLocation = jest.fn(() => ({
  pathname: '/',
  search: '',
  hash: '',
  state: null
}));

module.exports = {
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: mockUseParams,
  useLocation: mockUseLocation,
  BrowserRouter: ({ children }) => children,
  MemoryRouter: ({ children }) => children,
  Route: ({ children }) => children,
  Routes: ({ children }) => children
};