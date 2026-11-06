import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getAllReviews,
  deleteReview,
  getReviewsOverview,
  getOrderedItemsForReview,
} from '../services/reviews';
import { getErrorMessage } from '../services/api';
import { CANONICAL_ORDER } from '../services/menu';
import ReviewModal from './panels/ReviewModal';

export default function ReviewsSection({ onNavigateToLogin }) {
  const { user, isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [overview, setOverview] = useState({ avg_rating: 0, total_reviews: 0 });
  const [orderedItems, setOrderedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'mine'
  const [filterStar, setFilterStar] = useState('all');
  const [filterFood, setFilterFood] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Modals
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [isNewReviewModalOpen, setIsNewReviewModalOpen] = useState(false);

  const loadData = useCallback(async () => {
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
          // silent fail
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await deleteReview(reviewId);
      setToastMessage('✅ Review deleted successfully.');
      setTimeout(() => setToastMessage(''), 4000);
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
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

  // Distinct food items for filtering dropdown: combines reviews with canteen menu items
  const distinctFoodItems = Array.from(
    new Set([
      ...reviews.map((r) => r.food_item_name).filter(Boolean),
      ...CANONICAL_ORDER,
      ...orderedItems.map((i) => i.food_item_name).filter(Boolean),
    ])
  ).sort();

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'mine') {
      const isMine = r.is_owner || (user && (r.user === user.id || r.user_name === user.username));
      if (!isMine) return false;
    }
    if (filterStar !== 'all' && r.rating !== Number(filterStar)) {
      return false;
    }
    if (filterFood !== 'all' && r.food_item_name !== filterFood) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFood = (r.food_item_name || '').toLowerCase().includes(q);
      const matchComment = (r.comment || '').toLowerCase().includes(q);
      const matchUser = (r.user_name || '').toLowerCase().includes(q);
      if (!matchFood && !matchComment && !matchUser) return false;
    }
    return true;
  });

  // Calculate rating stats
  const totalCount = reviews.length;
  const avgRating =
    overview.avg_rating > 0
      ? overview.avg_rating
      : totalCount > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount
      : 5.0;

  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    if (starCounts[r.rating] !== undefined) starCounts[r.rating] += 1;
  });

  return (
    <section id="reviews-section" className="reviews-section-root" style={{ marginTop: 40, marginBottom: 40 }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            background: 'var(--primary)',
            color: '#fff',
            borderRadius: 'var(--radius-md, 12px)',
            padding: '12px 18px',
            marginBottom: 20,
            fontWeight: 700,
            fontSize: '0.9rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* ── Section Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full, 9999px)',
              fontSize: '0.8rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              marginBottom: 8,
            }}
          >
            ⭐ Customer Voice
          </div>
          <h2
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: 'var(--text)',
              margin: '0 0 4px',
              letterSpacing: '-0.4px',
            }}
          >
            Reviews &amp; Ratings
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
            Read genuine ratings from students and faculty, or rate food items you have ordered.
          </p>
        </div>

        <button
          className="panel-btn-primary"
          style={{
            width: 'auto',
            padding: '10px 22px',
            fontSize: '0.9rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-full, 9999px)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
          onClick={() => {
            if (!isAuthenticated) {
              if (onNavigateToLogin) onNavigateToLogin();
            } else {
              setIsNewReviewModalOpen(true);
            }
          }}
        >
          <span>⭐</span> Write a Review
        </button>
      </div>

      {/* ── Rating Highlights / Breakdown Card ── */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-xl, 18px)',
          padding: '24px 28px',
          marginBottom: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 24,
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Left: Overall Score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 'var(--radius-lg, 16px)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(245, 158, 11, 0.35)',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '1.9rem', fontWeight: 900, lineHeight: 1 }}>
              {Number(avgRating).toFixed(1)}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.9 }}>out of 5</span>
          </div>

          <div>
            <div style={{ color: '#f59e0b', fontSize: '1.25rem', letterSpacing: 2, marginBottom: 4 }}>
              {'★'.repeat(Math.round(avgRating))}
              <span style={{ color: 'var(--border-strong, #6b7280)' }}>
                {'★'.repeat(5 - Math.round(avgRating))}
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
              Overall Canteen Food Rating
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Based on {totalCount} verified review{totalCount === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        {/* Right: Star Distribution Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[5, 4, 3, 2, 1].map((s) => {
            const count = starCounts[s] || 0;
            const pct = totalCount > 0 ? (count / totalCount) * 100 : 0;
            return (
              <div
                key={s}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span style={{ width: 44, fontWeight: 700 }}>{s} Star{s > 1 ? 's' : ' '}</span>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    background: 'var(--surface-2, rgba(255,255,255,0.06))',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: '#f59e0b',
                      borderRadius: 4,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span style={{ width: 28, textAlign: 'right', fontWeight: 600 }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Ordered Items Quick-Rate Row (Requirement 2) ── */}
      {isAuthenticated && orderedItems.length > 0 && (
        <div
          style={{
            background: 'rgba(34,197,94,0.06)',
            border: '1.5px solid rgba(34,197,94,0.25)',
            borderRadius: 'var(--radius-xl, 16px)',
            padding: '16px 20px',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>📦</span> Rate Items You Ordered
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                You can give a 1–5 star review for dishes from your past orders:
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              paddingBottom: 6,
              scrollbarWidth: 'thin',
            }}
          >
            {orderedItems.map((item) => (
              <div
                key={item.food_item_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  padding: '8px 14px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>🍽️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>
                    {item.food_item_name}
                  </div>
                  {item.has_reviewed ? (
                    <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                      {'★'.repeat(item.rating || 5)} Reviewed
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Not yet reviewed</div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedOrderItem(item)}
                  style={{
                    background: item.has_reviewed ? 'rgba(59,130,246,0.1)' : 'var(--primary)',
                    color: item.has_reviewed ? '#3b82f6' : '#fff',
                    border: item.has_reviewed ? '1px solid rgba(59,130,246,0.3)' : 'none',
                    borderRadius: 'var(--radius-full, 20px)',
                    padding: '4px 12px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {item.has_reviewed ? '✏️ Edit' : '⭐ Rate'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reviews Controls (Tabs + Filters) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          borderBottom: '1.5px solid var(--border)',
          paddingBottom: 12,
          marginBottom: 20,
        }}
      >
        {/* Left Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full, 9999px)',
              border: 'none',
              background: activeTab === 'all' ? 'var(--primary)' : 'var(--surface)',
              color: activeTab === 'all' ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            All Reviews ({reviews.length})
          </button>

          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('mine')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full, 9999px)',
                border: 'none',
                background: activeTab === 'mine' ? 'var(--primary)' : 'var(--surface)',
                color: activeTab === 'mine' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.84rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
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

        {/* Right Filters */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '6px 12px',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.82rem',
                color: 'var(--text)',
                width: 130,
                fontFamily: 'inherit',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Star filter */}
          <select
            value={filterStar}
            onChange={(e) => setFilterStar(e.target.value)}
            style={{
              padding: '7px 12px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '0.82rem',
              fontWeight: 600,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          >
            <option value="all">All Stars (★)</option>
            <option value="5">5 Stars only</option>
            <option value="4">4 Stars only</option>
            <option value="3">3 Stars only</option>
            <option value="2">2 Stars only</option>
            <option value="1">1 Star only</option>
          </select>

          {/* Food filter */}
          {distinctFoodItems.length > 0 && (
            <select
              value={filterFood}
              onChange={(e) => setFilterFood(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                fontFamily: 'inherit',
                maxWidth: 160,
              }}
            >
              <option value="all">All Dishes</option>
              {distinctFoodItems.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Review Cards Grid ── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: '3px solid rgba(245,158,11,0.2)',
              borderTopColor: '#f59e0b',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span>Loading customer reviews…</span>
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
            borderRadius: 'var(--radius-md, 12px)',
            padding: '16px',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          ⚠ {error}
        </div>
      )}

      {!loading && !error && filteredReviews.length === 0 && (
        <div
          style={{
            background: 'var(--surface)',
            border: '1.5px dashed var(--border)',
            borderRadius: 'var(--radius-xl, 16px)',
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>💬</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>
            No reviews found
          </h3>
          <p style={{ fontSize: '0.88rem', margin: '0 0 16px' }}>
            {activeTab === 'mine'
              ? 'You have not submitted any food reviews yet. Order food and share your feedback!'
              : filterStar !== 'all' || filterFood !== 'all' || searchQuery
              ? 'No reviews match your selected filters.'
              : 'Be the first student or faculty member to review food from our canteen!'}
          </p>
          {isAuthenticated && (
            <button
              className="panel-btn-primary"
              style={{ width: 'auto', padding: '9px 24px', fontSize: '0.88rem' }}
              onClick={() => setIsNewReviewModalOpen(true)}
            >
              Write First Review ⭐
            </button>
          )}
        </div>
      )}

      {!loading && !error && filteredReviews.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 18,
          }}
        >
          {filteredReviews.map((rev) => {
            const isOwner =
              rev.is_owner || (user && (rev.user === user.id || rev.user_name === user.username));

            return (
              <div
                key={rev.id}
                style={{
                  background: 'var(--surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-xl, 16px)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                  boxShadow: 'var(--shadow-sm)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div>
                  {/* Card Header: Dish Name + Star Rating */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 10,
                      gap: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '1.05rem',
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

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: '#f59e0b', fontSize: '1.05rem', letterSpacing: 2 }}>
                        {'★'.repeat(Math.max(1, Math.min(5, rev.rating)))}
                        <span style={{ color: 'var(--border-strong, #6b7280)' }}>
                          {'★'.repeat(Math.max(0, 5 - Math.min(5, rev.rating)))}
                        </span>
                      </div>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: '#f59e0b',
                          background: 'rgba(245, 158, 11, 0.12)',
                          padding: '1px 6px',
                          borderRadius: 4,
                          marginTop: 2,
                        }}
                      >
                        {rev.rating}.0 / 5.0
                      </span>
                    </div>
                  </div>

                  {/* Review Text */}
                  <div
                    style={{
                      background: 'var(--surface-2, rgba(255,255,255,0.03))',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md, 10px)',
                      border: '1px solid var(--border)',
                      fontSize: '0.9rem',
                      lineHeight: 1.55,
                      color: 'var(--text)',
                      marginBottom: 16,
                      wordBreak: 'break-word',
                    }}
                  >
                    "{rev.comment}"
                  </div>
                </div>

                {/* Card Footer: Reviewer info + Edit / Delete buttons */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--border)',
                    paddingTop: 12,
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'var(--primary)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {(rev.user_name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                        {rev.user_name || 'Student / Faculty'}
                      </div>
                      {isOwner && (
                        <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 700 }}>
                          Your Review
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit / Delete (Requirement 9) */}
                  {isOwner && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setEditingReview(rev)}
                        style={{
                          background: 'rgba(59,130,246,0.1)',
                          border: '1px solid rgba(59,130,246,0.3)',
                          color: '#3b82f6',
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontFamily: 'inherit',
                          transition: 'background 0.2s',
                        }}
                        title="Edit your review"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rev.id)}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          color: '#ef4444',
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontFamily: 'inherit',
                          transition: 'background 0.2s',
                        }}
                        title="Delete your review"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {/* 1. Review specific ordered item modal */}
      {selectedOrderItem && (
        <ReviewModal
          key={`order-item-${selectedOrderItem.food_item_id || selectedOrderItem.id}`}
          orderItem={{
            id: selectedOrderItem.food_item_id,
            name: selectedOrderItem.food_item_name,
            food_item_name: selectedOrderItem.food_item_name,
            food_item: selectedOrderItem.food_item_id,
          }}
          selectedFoodName={selectedOrderItem.food_item_name}
          orderId={selectedOrderItem.order_id}
          initialReview={
            selectedOrderItem.has_reviewed
              ? {
                  id: selectedOrderItem.review_id,
                  food_item: selectedOrderItem.food_item_id,
                  food_item_name: selectedOrderItem.food_item_name,
                  rating: selectedOrderItem.rating || 5,
                  comment: selectedOrderItem.comment || '',
                }
              : null
          }
          onClose={() => setSelectedOrderItem(null)}
          onSuccess={() => {
            setToastMessage('🎉 Review submitted successfully!');
            setTimeout(() => setToastMessage(''), 4000);
            loadData();
            setSelectedOrderItem(null);
          }}
        />
      )}

      {/* 2. Write general review modal */}
      {isNewReviewModalOpen && (
        <ReviewModal
          key={`new-review-${filterFood}`}
          selectedFoodName={filterFood !== 'all' ? filterFood : null}
          onClose={() => setIsNewReviewModalOpen(false)}
          onSuccess={() => {
            setToastMessage('🎉 Review submitted successfully!');
            setTimeout(() => setToastMessage(''), 4000);
            loadData();
            setIsNewReviewModalOpen(false);
          }}
        />
      )}

      {/* 3. Edit review modal */}
      {editingReview && (
        <ReviewModal
          key={`edit-review-${editingReview.id}`}
          initialReview={editingReview}
          selectedFoodName={editingReview.food_item_name}
          onClose={() => setEditingReview(null)}
          onSuccess={() => {
            setToastMessage('✅ Review updated successfully!');
            setTimeout(() => setToastMessage(''), 4000);
            loadData();
            setEditingReview(null);
          }}
        />
      )}
    </section>
  );
}
