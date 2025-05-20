import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// Hook personalizado para acceder al contexto de autenticaciónn
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  
  return context;
};