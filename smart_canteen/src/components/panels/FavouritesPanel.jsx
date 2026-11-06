import React, { useEffect, useState, useCallback } from 'react';
import './panels.css';
import { useAuth } from '../../context/AuthContext';
import { getFavorites, removeFavoriteByItem } from '../../services/favorites';
import { useCart } from '../../context/CartContext';
import { getErrorMessage } from '../../services/api';
import { getFoodItemImage } from '../../services/menu';

export default function FavouritesPanel({ onClose }) {
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);
  const [cartMsg, setCartMsg] = useState('');

  useEffect(() => {
    if (isAuthenticated) loadFavorites();
  }, [isAuthenticated]);

  async function loadFavorites() {
    setLoading(true);
    setError('');
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(foodItemId) {
    setRemoving(foodItemId);
    setError('');
    try {
      await removeFavoriteByItem(foodItemId);
      setFavorites(prev => prev.filter(f => f.food_item?.id !== foodItemId && f.food_item !== foodItemId));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRemoving(null);
    }
  }

  async function handleAddToCart(foodItemId) {
    setAddingToCart(foodItemId);
    try {
      await addItem(foodItemId, 1);
      setCartMsg('Added to cart!');
      setTimeout(() => setCartMsg(''), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAddingToCart(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <>
        <div className="panel-overlay" onClick={onClose} />
        <div className="panel-drawer">
          <div className="panel-header">
            <h2 className="panel-title">❤️ Favourites</h2>
            <button className="panel-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="panel-body">
            <div className="panel-empty">
              <div className="panel-empty-icon">🔐</div>
              <p className="panel-empty-title">Login Required</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer">
        <div className="panel-header">
          <h2 className="panel-title">❤️ Favourites <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>({favorites.length})</span></h2>
          <button className="panel-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="panel-body">
          {loading && (
            <div className="panel-loading">
              <div className="panel-spinner" />
              <span>Loading favourites…</span>
            </div>
          )}

          {error && <div className="panel-error">⚠ {error}</div>}
          {cartMsg && <div className="panel-success">✅ {cartMsg}</div>}

          {!loading && favorites.length === 0 && (
            <div className="panel-empty">
              <div className="panel-empty-icon">💔</div>
              <p className="panel-empty-title">No favourites yet</p>
              <p className="panel-empty-desc">Tap the ❤️ on any food item to add it here.</p>
            </div>
          )}

          {favorites.map((fav) => {
            const food = fav.food_item;
            if (!food) return null;
            const imgUrl = getFoodItemImage(food);
            const isRemoving = removing === food.id;
            const isAdding = addingToCart === food.id;

            return (
              <div key={fav.id} className="panel-card" style={{ display: 'flex', gap: 14, alignItems: 'center', opacity: isRemoving ? 0.5 : 1 }}>
                <div className="panel-food-img">
                  {imgUrl ? <img src={imgUrl} alt={food.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} /> : '🍽️'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.93rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{food.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>{food.category_name}</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{food.price}</div>
                  {!food.is_available && <div style={{ fontSize: '0.75rem', color: '#f87171', marginTop: 2 }}>Unavailable</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  {food.is_available && (
                    <button className="panel-btn-primary" style={{ padding: '7px 12px', fontSize: '0.78rem', width: 'auto' }} onClick={() => handleAddToCart(food.id)} disabled={isAdding}>
                      {isAdding ? '…' : '+ Cart'}
                    </button>
                  )}
                  <button className="panel-btn-danger" style={{ padding: '5px 10px', fontSize: '0.78rem' }} onClick={() => handleRemove(food.id)} disabled={isRemoving}>
                    {isRemoving ? '…' : '✕'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
