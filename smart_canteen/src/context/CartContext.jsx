import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getCart, addToCart as apiAddToCart, updateCartItem as apiUpdateCartItem, removeCartItem as apiRemoveCartItem, clearCart as apiClearCart } from '../services/cart';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null); // null = not loaded, {} = empty cart
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load cart when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      setCart(null);
    }
  }, [isAuthenticated]);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const data = await getCart();
      setCart(data);
    } catch (err) {
      setError('Failed to load cart.');
      setCart({ items: [], total_price: '0.00', final_price: '0.00' });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addItem = useCallback(async (foodItemId, quantity = 1) => {
    if (!isAuthenticated) return null;
    setLoading(true);
    try {
      const updated = await apiAddToCart(foodItemId, quantity);
      setCart(updated);
      return updated;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const updateItem = useCallback(async (itemId, quantity) => {
    if (!isAuthenticated) return null;
    setLoading(true);
    try {
      const updated = await apiUpdateCartItem(itemId, quantity);
      setCart(updated);
      return updated;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const removeItem = useCallback(async (itemId) => {
    if (!isAuthenticated) return null;
    setLoading(true);
    try {
      const updated = await apiRemoveCartItem(itemId);
      setCart(updated);
      return updated;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const clearAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      await apiClearCart();
      setCart({ items: [], total_price: '0.00', discount_amount: '0.00', final_price: '0.00' });
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Computed helpers
  const totalCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalPrice = parseFloat(cart?.final_price || '0');

  const value = {
    cart,
    loading,
    error,
    totalCount,
    totalPrice,
    loadCart,
    addItem,
    updateItem,
    removeItem,
    clearAll,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
