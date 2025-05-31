// src/contexts/CartContext.js - Versión mejorada con carrito individual por usuario
import { createContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth'; // Importar el hook de autenticación

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth(); // Obtener el usuario actual
  const [cartItems, setCartItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
 
  // Función para obtener la clave del carrito específica del usuario
  const getCartKey = (userId) => {
    return userId ? `cart_${userId}` : 'cart_guest';
  };
 
  // Cargar el carrito del usuario actual desde localStorage
  useEffect(() => {
    if (!user?.id) {
      // Si no hay usuario, limpiar el carrito
      console.log('👤 No hay usuario logueado, limpiando carrito');
      setCartItems([]);
      return;
    }

    const cartKey = getCartKey(user.id);
    console.log(`🛒 Cargando carrito para usuario: ${user.nombreCompleto} (${user.id})`);
   
    const storedCart = localStorage.getItem(cartKey);
    if (storedCart) {
      try {
        const parsedCart = JSON.parse(storedCart);
        console.log(`📦 Carrito cargado: ${parsedCart.length} productos`);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('❌ Error al cargar el carrito desde localStorage:', error);
        setCartItems([]);
      }
    } else {
      console.log('🆕 Carrito vacío para este usuario');
      setCartItems([]);
    }
  }, [user?.id]); // Ejecutar cuando cambie el ID del usuario
 
  // Guardar el carrito en localStorage cuando cambie
  useEffect(() => {
    if (!user?.id) {
      // Si no hay usuario, no guardar nada
      return;
    }

    const cartKey = getCartKey(user.id);
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
    console.log(`💾 Carrito guardado para ${user.nombreCompleto}: ${cartItems.length} productos`);
   
    // Calcular totales
    let items = 0;
    let price = 0;
   
    cartItems.forEach(item => {
      items += item.quantity;
      price += item.precio * item.quantity;
    });
   
    setTotalItems(items);
    setTotalPrice(price);
  }, [cartItems, user?.id]);
 
  // Limpiar carrito cuando el usuario se deslogea
  useEffect(() => {
    if (!user) {
      console.log('🚪 Usuario deslogueado, limpiando carrito');
      setCartItems([]);
      setTotalItems(0);
      setTotalPrice(0);
    }
  }, [user]);
 
  // Agregar producto al carrito
  const addToCart = (product, restaurantName) => {
    // Verificar que hay un usuario logueado
    if (!user?.id) {
      console.warn('⚠️ Intento de agregar al carrito sin usuario logueado');
      return {
        success: false,
        reason: 'Debes iniciar sesión para agregar productos al carrito.',
        requiresLogin: true
      };
    }

    const currentRestaurant = cartItems.length > 0 ? cartItems[0].restaurantName : null;

    // Si hay un restaurante distinto al actual
    if (currentRestaurant && currentRestaurant !== restaurantName) {
      return {
        success: false,
        reason: 'No se pueden mezclar productos de diferentes restaurantes.',
        currentRestaurant,
        newRestaurant: restaurantName
      };
    }

    console.log(`➕ Agregando producto al carrito de ${user.nombreCompleto}: ${product.nombre}`);

    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === product.id);

      if (existingItemIndex !== -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return updatedItems;
      } else {
        return [...prevItems, {
          ...product,
          quantity: 1,
          restaurantName,
          addedBy: user.id, // Marcar quién agregó el producto
          addedAt: new Date().toISOString() // Marca de tiempo
        }];
      }
    });

    return { success: true };
  };
 
  // Remover producto del carrito
  const removeFromCart = (productId) => {
    if (!user?.id) {
      console.warn('⚠️ Intento de remover del carrito sin usuario logueado');
      return;
    }

    console.log(`➖ Reduciendo cantidad del carrito de ${user.nombreCompleto}: ${productId}`);

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
     
      return prevItems;
    });
  };
 
  // Eliminar completamente un producto del carrito
  const removeItemCompletely = (productId) => {
    if (!user?.id) {
      console.warn('⚠️ Intento de eliminar del carrito sin usuario logueado');
      return;
    }

    console.log(`🗑️ Eliminando completamente del carrito de ${user.nombreCompleto}: ${productId}`);
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };
 
  // Obtener la cantidad de un producto en el carrito
  const getItemQuantity = (productId) => {
    if (!user?.id) {
      return 0;
    }
   
    const item = cartItems.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };
 
  // Vaciar el carrito
  const clearCart = () => {
    if (!user?.id) {
      console.warn('⚠️ Intento de limpiar carrito sin usuario logueado');
      return;
    }

    console.log(`🧹 Limpiando carrito de ${user.nombreCompleto}`);
    setCartItems([]);
   
    // También limpiar del localStorage
    const cartKey = getCartKey(user.id);
    localStorage.removeItem(cartKey);
  };
 
  // Actualizar la cantidad de un producto específico
  const updateItemQuantity = (productId, quantity) => {
    if (!user?.id) {
      console.warn('⚠️ Intento de actualizar cantidad sin usuario logueado');
      return;
    }

    if (quantity <= 0) {
      removeItemCompletely(productId);
      return;
    }
   
    console.log(`🔄 Actualizando cantidad en carrito de ${user.nombreCompleto}: ${productId} -> ${quantity}`);
   
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

  // Función para debug - ver el estado del carrito
  const getCartInfo = () => {
    return {
      userId: user?.id,
      userName: user?.nombreCompleto,
      cartKey: user?.id ? getCartKey(user.id) : null,
      itemsCount: cartItems.length,
      totalItems,
      totalPrice
    };
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
        updateItemQuantity,
        getCartInfo // Para debugging
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartProvider;