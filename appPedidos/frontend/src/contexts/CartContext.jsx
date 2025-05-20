// src/contexts/CartContextt.js
import { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  
  // Cargar el carrito desde localStorage al iniciar
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error al cargar el carrito desde localStorage:', error);
        // Si hay un error, inicializar con un carrito vacío
        setCartItems([]);
      }
    }
  }, []);
  
  // Actualizar localStorage cuando cambia el carrito
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    
    // Calcular totales
    let items = 0;
    let price = 0;
    
    cartItems.forEach(item => {
      items += item.quantity;
      price += item.precio * item.quantity;
    });
    
    setTotalItems(items);
    setTotalPrice(price);
  }, [cartItems]);
  
  // Agregar producto al carrito
  const addToCart = (product) => {
    setCartItems(prevItems => {
      // Verificar si el producto ya está en el carrito
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex !== -1) {
        // Si ya existe, incrementar la cantidad
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return updatedItems;
      } else {
        // Si no existe, agregarlo con cantidad 1
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };
  
  // Remover producto del carrito
  const removeFromCart = (productId) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === productId);
      
      if (existingItemIndex !== -1) {
        const currentQuantity = prevItems[existingItemIndex].quantity;
        
        if (currentQuantity > 1) {
          // Decrementar la cantidad
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: currentQuantity - 1
          };
          return updatedItems;
        } else {
          // Eliminar el producto si la cantidad es 1
          return prevItems.filter(item => item.id !== productId);
        }
      }
      
      // Si no se encuentra el producto, devolver el carrito sin cambios
      return prevItems;
    });
  };
  
  // Eliminar completamente un producto del carrito
  const removeItemCompletely = (productId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };
  
  // Obtener la cantidad de un producto en el carrito
  const getItemQuantity = (productId) => {
    const item = cartItems.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };
  
  // Vaciar el carrito
  const clearCart = () => {
    setCartItems([]);
  };
  
  // Actualizar la cantidad de un producto específico
  const updateItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeItemCompletely(productId);
      return;
    }
    
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === productId);
      
      if (existingItemIndex !== -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity
        };
        return updatedItems;
      }
      
      return prevItems;
    });
  };
  
  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItems,
        totalPrice,
        addToCart,
        removeFromCart,
        removeItemCompletely,
        getItemQuantity,
        clearCart,
        updateItemQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;