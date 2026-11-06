import React, { useState, useEffect, useCallback } from 'react';
import './panels.css';
import { useAuth } from '../../context/AuthContext';
import {
  getAllReviews,
  deleteReview,
  getReviewsOverview,
  getOrderedItemsForReview,
} from '../../services/reviews';
import { getErrorMessage } from '../../services/api';
import { CANONICAL_ORDER } from '../../services/menu';
import ReviewModal from './ReviewModal';

export default function ReviewsPanel({ onClose, onNavigateToLogin, initialFoodFilter = 'all' }) {
  const { user, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [overview, setOverview] = useState({ avg_rating: 0, total_reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'mine'
  const [starFilter, setStarFilter] = useState('all'); // 'all' | 5 | 4 | 3 | 2 | 1
  const [foodFilter, setFoodFilter] = useState(initialFoodFilter);

  // Modal states
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [targetFoodForReview, setTargetFoodForReview] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [orderedItems, setOrderedItems] = useState([]);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Synchronize foodFilter if initialFoodFilter changes
  useEffect(() => {
    if (initialFoodFilter && initialFoodFilter !== 'all') {
      setFoodFilter(initialFoodFilter);
    }
  }, [initialFoodFilter]);

  const loadReviewsData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [allRev, ov] = await Promise.all([
        getAllReviews(),
        getReviewsOverview().catch(() => ({ avg_rating: 0, total_reviews: 0 })),
      ]);
      setReviews(allRev);
      setOverview(ov);

      if (isAuthenticated) {
        try {
          const ord = await getOrderedItemsForReview();
          setOrderedItems(ord);
        } catch {
          // silent fail for ordered items
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadReviewsData();
  }, [loadReviewsData]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await deleteReview(reviewId);
      setActionSuccessMsg('✅ Review deleted successfully.');
      setTimeout(() => setActionSuccessMsg(''), 4000);
      loadReviewsData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // Distinct food items for filtering: combines reviews with all canteen food items
  const distinctFoodNames = Array.from(
    new Set([
      ...reviews.map((r) => r.food_item_name).filter(Boolean),
      ...CANONICAL_ORDER,
      ...orderedItems.map((i) => i.food_item_name).filter(Boolean),
    ])
  ).sort();

  // Filtered reviews
  const displayedReviews = reviews.filter((r) => {
    if (activeTab === 'mine') {
      const isMine = r.is_owner || (user && (r.user === user.id || r.user_name === user.username));
      if (!isMine) return false;
    }
    if (starFilter !== 'all' && r.rating !== Number(starFilter)) {
      return false;
    }
    if (foodFilter !== 'all' && r.food_item_name !== foodFilter) {
      return false;
    }
    return true;
  });

  const renderStars = (rating) => {
    return (
      <span style={{ color: '#f59e0b', fontSize: '1rem', letterSpacing: '2px' }}>
        {'★'.repeat(Math.max(1, Math.min(5, rating)))}
        <span style={{ color: 'var(--border-strong, #6b7280)' }}>
          {'★'.repeat(Math.max(0, 5 - Math.min(5, rating)))}
        </span>
      </span>
    );
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <div className="panel-drawer" style={{ width: '100%', maxWidth: '480px' }}>
        {/* Header */}
        <div className="panel-header">
          <h2 className="panel-title">⭐ Food Reviews &amp; Ratings</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="panel-btn-secondary"
              style={{ fontSize: '0.75rem', padding: '5px 10px' }}
              onClick={loadReviewsData}
              title="Refresh Reviews"
            >
              🔄 Refresh
            </button>
            <button className="panel-close-btn" onClick={onClose} aria-label="Close panel">
              ✕
            </button>
          </div>
        </div>

        {/* Rating Overview Bar */}
        <div
          style={{
            padding: '14px 20px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(34,197,94,0.08) 100%)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text)' }}>
                {overview.avg_rating > 0 ? overview.avg_rating.toFixed(1) : (reviews.length > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : '5.0')}
              </span>
              <span style={{ color: '#f59e0b', fontSize: '1.2rem' }}>★</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Based on {reviews.length} community reviews
            </div>
          </div>

          <button
            className="panel-btn-primary"
            style={{ width: 'auto', padding: '8px 16px', fontSize: '0.82rem' }}
            onClick={() => {
              if (!isAuthenticated) {
                if (onNavigateToLogin) onNavigateToLogin();
              } else {
                setTargetFoodForReview(foodFilter !== 'all' ? foodFilter : null);
                setIsWriteModalOpen(true);
              }
            }}
          >
            ⭐ Write a Review
          </button>
        </div>

        {/* Success Alert */}
        {actionSuccessMsg && (
          <div
            style={{
              background: 'rgba(34,197,94,0.12)',
              borderBottom: '1px solid rgba(34,197,94,0.3)',
              color: 'var(--primary)',
              padding: '10px 16px',
              fontSize: '0.84rem',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {actionSuccessMsg}
          </div>
        )}

        {/* Tabs: All Reviews vs My Reviews */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              flex: 1,
              padding: '11px',
              border: 'none',
              background: activeTab === 'all' ? 'rgba(245,158,11,0.1)' : 'transparent',
              color: activeTab === 'all' ? '#f59e0b' : 'var(--text-muted)',
              fontWeight: activeTab === 'all' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              borderBottom: activeTab === 'all' ? '2.5px solid #f59e0b' : '2.5px solid transparent',
            }}
          >
            All Reviews ({reviews.length})
          </button>

          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('mine')}
              style={{
                flex: 1,
                padding: '11px',
                border: 'none',
                background: activeTab === 'mine' ? 'rgba(245,158,11,0.1)' : 'transparent',
                color: activeTab === 'mine' ? '#f59e0b' : 'var(--text-muted)',
                fontWeight: activeTab === 'mine' ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                borderBottom: activeTab === 'mine' ? '2.5px solid #f59e0b' : '2.5px solid transparent',
              }}
            >
              My Reviews (
              {
                reviews.filter(
                  (r) => r.is_owner || (user && (r.user === user.id || r.user_name === user.username))
                ).length
              }
              )
            </button>
          )}
        </div>

        {/* Filters bar */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2, rgba(255,255,255,0.02))',
            alignItems: 'center',
          }}
        >
          {/* Star filter */}
          <select
            value={starFilter}
            onChange={(e) => setStarFilter(e.target.value)}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '0.78rem',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          >
            <option value="all">All Ratings (★)</option>
            <option value="5">5 Stars only</option>
            <option value="4">4 Stars only</option>
            <option value="3">3 Stars only</option>
            <option value="2">2 Stars only</option>
            <option value="1">1 Star only</option>
          </select>

          {/* Food filter */}
          {distinctFoodNames.length > 0 && (
            <select
              value={foodFilter}
              onChange={(e) => setFoodFilter(e.target.value)}
              style={{
                flex: 1.2,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '0.78rem',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            >
              <option value="all">All Food Items</option>
              {distinctFoodNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Panel Body */}
        <div className="panel-body">
          {loading && (
            <div className="panel-loading">
              <div className="panel-spinner" />
              <span>Loading reviews &amp; ratings…</span>
            </div>
          )}

          {error && <div className="panel-error">⚠ {error}</div>}

          {!loading && displayedReviews.length === 0 && (
            <div className="panel-empty">
              <div className="panel-empty-icon">⭐</div>
              <p className="panel-empty-title">No reviews found</p>
              <p className="panel-empty-desc">
                {activeTab === 'mine'
                  ? "You haven't submitted any food reviews yet. Order food to rate your meals!"
                  : starFilter !== 'all' || foodFilter !== 'all'
                  ? 'No reviews match the selected filter.'
                  : 'Be the first to share a review for our canteen food!'}
              </p>
              {isAuthenticated && (
                <button
                  className="panel-btn-primary"
                  style={{ width: 'auto', marginTop: 12, padding: '8px 20px' }}
                  onClick={() => setIsWriteModalOpen(true)}
                >
                  Write First Review
                </button>
              )}
            </div>
          )}

          {/* Review Cards */}
          {!loading &&
            displayedReviews.map((rev) => {
              const isOwner =
                rev.is_owner || (user && (rev.user === user.id || rev.user_name === user.username));

              return (
                <div
                  key={rev.id}
                  className="panel-card"
                  style={{
                    marginBottom: 12,
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg, 14px)',
                    padding: '14px 16px',
                    background: 'var(--surface)',
                  }}
                >
                  {/* Card Header: Food name + rating */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 6,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '0.98rem',
                          color: 'var(--text)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span>🍽️</span> {rev.food_item_name || 'Food Item'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Reviewed on {formatDate(rev.created_at)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {renderStars(rev.rating)}
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#f59e0b',
                          marginTop: 2,
                        }}
                      >
                        {rev.rating}.0 / 5.0
                      </div>
                    </div>
                  </div>

                  {/* Comment text */}
                  <p
                    style={{
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      color: 'var(--text)',
                      margin: '10px 0 12px',
                      background: 'var(--surface-2, rgba(255,255,255,0.03))',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      wordBreak: 'break-word',
                    }}
                  >
                    "{rev.comment}"
                  </p>

                  {/* Card Footer: Reviewer + Edit/Delete */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid var(--border)',
                      paddingTop: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'var(--primary, #22c55e)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {(rev.user_name || 'U')[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {rev.user_name || 'Verified User'}
                      </span>
                      {isOwner && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            background: 'rgba(34,197,94,0.15)',
                            color: 'var(--primary)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            fontWeight: 700,
                          }}
                        >
                          You
                        </span>
                      )}
                    </div>

                    {/* Requirement 9: Edit and Delete buttons for author, or Rate button for others */}
                    {isOwner ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setEditingReview(rev)}
                          style={{
                            background: 'rgba(59,130,246,0.1)',
                            border: '1px solid rgba(59,130,246,0.3)',
                            color: '#3b82f6',
                            fontSize: '0.74rem',
                            padding: '3px 8px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                          title="Edit this review"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rev.id)}
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#ef4444',
                            fontSize: '0.74rem',
                            padding: '3px 8px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                          title="Delete this review"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            if (onNavigateToLogin) onNavigateToLogin();
                          } else {
                            setTargetFoodForReview(rev.food_item_name);
                            setIsWriteModalOpen(true);
                          }
                        }}
                        style={{
                          background: 'rgba(245,158,11,0.1)',
                          border: '1px solid rgba(245,158,11,0.3)',
                          color: '#f59e0b',
                          fontSize: '0.74rem',
                          padding: '3px 9px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                        title={`Write a review for ${rev.food_item_name}`}
                      >
                        ⭐ Rate Dish
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Write Review Modal */}
      {isWriteModalOpen && (
        <ReviewModal
          key={`write-${targetFoodForReview || foodFilter || 'new'}`}
          selectedFoodName={targetFoodForReview || (foodFilter !== 'all' ? foodFilter : null)}
          onClose={() => {
            setIsWriteModalOpen(false);
            setTargetFoodForReview(null);
          }}
          onSuccess={() => {
            setActionSuccessMsg('🎉 Review submitted successfully!');
            setTimeout(() => setActionSuccessMsg(''), 4000);
            loadReviewsData();
            setIsWriteModalOpen(false);
            setTargetFoodForReview(null);
          }}
        />
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <ReviewModal
          key={`edit-${editingReview.id}`}
          initialReview={editingReview}
          selectedFoodName={editingReview.food_item_name}
          onClose={() => setEditingReview(null)}
          onSuccess={() => {
            setActionSuccessMsg('✅ Review updated successfully!');
            setTimeout(() => setActionSuccessMsg(''), 4000);
            loadReviewsData();
            setEditingReview(null);
          }}
        />
      )}
    </>
  );
}
