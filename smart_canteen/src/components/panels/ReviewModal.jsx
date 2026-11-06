import React, { useState, useEffect, useCallback } from 'react';
import './panels.css';
import { createReview, updateReview, getOrderedItemsForReview, getMyReviews } from '../../services/reviews';
import { getErrorMessage } from '../../services/api';
import { getFoodItemImage, fetchFoodItems } from '../../services/menu';

export default function ReviewModal({
  orderItem = null,
  orderId = null,
  initialReview = null,
  selectedFoodName = null,
  selectedFoodItem = null,
  onClose,
  onSuccess,
}) {
  const [orderedItems, setOrderedItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active review state
  const [selectedFoodId, setSelectedFoodId] = useState(() => {
    if (initialReview) return initialReview.food_item;
    if (orderItem) return orderItem.food_item?.id || orderItem.food_item || orderItem.id;
    if (selectedFoodItem) return selectedFoodItem.id;
    return '';
  });

  const [currentFoodName, setCurrentFoodName] = useState(() => {
    if (initialReview) return initialReview.food_item_name || '';
    if (orderItem) return orderItem.food_item_name || orderItem.food_item?.name || orderItem.name || '';
    if (selectedFoodItem) return selectedFoodItem.name || '';
    if (selectedFoodName) return selectedFoodName;
    return '';
  });

  const [rating, setRating] = useState(() => (initialReview ? initialReview.rating : 5));
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(() => (initialReview ? initialReview.comment || '' : ''));
  const [effectiveReviewId, setEffectiveReviewId] = useState(() => (initialReview ? initialReview.id : null));

  // Switch to a new food item and load existing review data if previously reviewed
  const selectFood = useCallback((food, userReviews = myReviews) => {
    if (!food) return;
    const fId = food.id || food.food_item_id || food.food_item;
    const fName = food.name || food.food_item_name || food.foodName || '';

    setSelectedFoodId(fId);
    setCurrentFoodName(fName);
    setError('');

    // Check if user already reviewed this item
    const existing = (userReviews || []).find(
      (r) =>
        (fId && (Number(r.food_item) === Number(fId) || (r.food_item && Number(r.food_item.id) === Number(fId)))) ||
        (fName && r.food_item_name && r.food_item_name.toLowerCase().trim() === fName.toLowerCase().trim())
    ) || (food.has_reviewed ? { rating: food.rating, comment: food.comment, id: food.review_id } : null);

    if (existing) {
      setRating(existing.rating || 5);
      setComment(existing.comment || '');
      setEffectiveReviewId(existing.id || existing.review_id || null);
    } else {
      setRating(5);
      setComment('');
      setEffectiveReviewId(null);
    }
  }, [myReviews]);

  // Load ordered items, all menu items, and user's reviews
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoadingItems(true);
      try {
        const [ordItems, allItems, revs] = await Promise.all([
          getOrderedItemsForReview().catch(() => []),
          fetchFoodItems().catch(() => []),
          getMyReviews().catch(() => []),
        ]);

        if (!isMounted) return;

        setOrderedItems(ordItems);
        setMenuItems(allItems);
        setMyReviews(revs);

        // 1. If editing an existing review
        if (initialReview) {
          setSelectedFoodId(initialReview.food_item);
          setCurrentFoodName(initialReview.food_item_name || '');
          setRating(initialReview.rating || 5);
          setComment(initialReview.comment || '');
          setEffectiveReviewId(initialReview.id);
          return;
        }

        // 2. If an orderItem was explicitly passed
        if (orderItem) {
          const oId = orderItem.food_item?.id || orderItem.food_item || orderItem.id;
          const oName = orderItem.food_item_name || orderItem.food_item?.name || orderItem.name || '';
          setSelectedFoodId(oId);
          setCurrentFoodName(oName);
          selectFood({ id: oId, name: oName, ...orderItem }, revs);
          return;
        }

        // 3. If a selectedFoodItem was explicitly passed
        if (selectedFoodItem) {
          setSelectedFoodId(selectedFoodItem.id);
          setCurrentFoodName(selectedFoodItem.name || '');
          selectFood(selectedFoodItem, revs);
          return;
        }

        // 4. If selectedFoodName was passed (from a filter or food click)
        if (selectedFoodName && selectedFoodName !== 'all') {
          const matchOrd = ordItems.find(
            (i) => (i.food_item_name || '').toLowerCase().trim() === selectedFoodName.toLowerCase().trim()
          );
          const matchMenu = allItems.find(
            (i) => (i.name || '').toLowerCase().trim() === selectedFoodName.toLowerCase().trim()
          );
          const target = matchOrd || matchMenu || { name: selectedFoodName };
          selectFood(target, revs);
          return;
        }

        // 5. Fallback: Prioritize first unreviewed ordered item, or first ordered item
        if (ordItems.length > 0) {
          const unreviewed = ordItems.find((i) => !i.has_reviewed);
          const chosen = unreviewed || ordItems[0];
          selectFood(chosen, revs);
        } else if (allItems.length > 0) {
          selectFood(allItems[0], revs);
        }
      } catch (err) {
        if (isMounted) setError(getErrorMessage(err));
      } finally {
        if (isMounted) setLoadingItems(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [initialReview, orderItem, selectedFoodItem, selectedFoodName]);

  const isUpdatingExisting = Boolean(effectiveReviewId);

  // Available items for user to tap & switch between (no dropdown)
  const selectableItems = (() => {
    const list = [];
    const seenNames = new Set();

    // Ordered items first
    for (const item of orderedItems) {
      const name = item.food_item_name || item.name;
      if (name && !seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        list.push({
          id: item.food_item_id || item.id,
          name,
          image: item.image,
          price: item.price,
          isOrdered: true,
          has_reviewed: item.has_reviewed,
          rating: item.rating,
          comment: item.comment,
          review_id: item.review_id,
        });
      }
    }

    // Additional menu items
    for (const item of menuItems) {
      const name = item.name;
      if (name && !seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        list.push({
          id: item.id,
          name,
          image: item.image,
          price: item.price,
          isOrdered: false,
          has_reviewed: false,
        });
      }
    }

    return list;
  })();

  const currentItem = selectableItems.find(
    (i) =>
      (selectedFoodId && String(i.id) === String(selectedFoodId)) ||
      (currentFoodName && i.name.toLowerCase().trim() === currentFoodName.toLowerCase().trim())
  );

  const displayName = currentFoodName || currentItem?.name || 'Selected Food Item';
  const displayImage = getFoodItemImage({ name: displayName, image: currentItem?.image });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedFoodId) {
      setError('Please select a food item to review.');
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a rating between 1 and 5 stars.');
      return;
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setError('Please write a review comment before submitting. Empty reviews are not allowed.');
      return;
    }

    if (trimmedComment.length < 3) {
      setError('Review comment must be at least 3 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (effectiveReviewId) {
        // Direct update of existing review
        await updateReview(effectiveReviewId, {
          rating,
          comment: trimmedComment,
          foodItemId: Number(selectedFoodId),
          foodItemName: displayName,
        });
      } else {
        try {
          await createReview({
            foodItemId: Number(selectedFoodId),
            orderId: orderId || null,
            rating,
            comment: trimmedComment,
            foodItemName: displayName,
          });
        } catch (createErr) {
          const errMsg = getErrorMessage(createErr);
          // If backend reports item was already reviewed, automatically find & update that review
          if (errMsg.toLowerCase().includes('already reviewed')) {
            const revs = await getMyReviews();
            const existingRev = revs.find(
              (r) =>
                Number(r.food_item) === Number(selectedFoodId) ||
                (r.food_item && r.food_item.id === Number(selectedFoodId)) ||
                (r.food_item_name && r.food_item_name.toLowerCase() === displayName.toLowerCase())
            );
            if (existingRev) {
              await updateReview(existingRev.id, {
                rating,
                comment: trimmedComment,
                foodItemId: Number(selectedFoodId),
                foodItemName: displayName,
              });
            } else {
              throw createErr;
            }
          } else if (errMsg.toLowerCase().includes('only review food items you have ordered')) {
            throw new Error(`In Smart Canteen, you can review dishes from your completed orders. Please order '${displayName}' first, or select one of your ordered dishes to rate.`);
          } else {
            throw createErr;
          }
        }
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('connect') || msg.toLowerCase().includes('connection')) {
        setError('Cannot connect to server. Please make sure the Django backend server is running (start_backend.bat on port 8000).');
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="panel-overlay" onClick={onClose} style={{ zIndex: 1100 }} />
      <div
        className="panel-drawer"
        style={{
          zIndex: 1101,
          maxWidth: '460px',
          width: '92%',
          height: 'auto',
          maxHeight: '94vh',
          borderRadius: 'var(--radius-xl, 20px)',
          margin: 'auto',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          position: 'fixed',
          boxShadow: 'var(--shadow-xl, 0 20px 40px rgba(0,0,0,0.45))',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="panel-title">
            {isUpdatingExisting ? '✏️ Edit Your Review' : '⭐ Rate Your Food'}
          </h2>
          <button className="panel-close-btn" onClick={onClose} aria-label="Close review modal">
            ✕
          </button>
        </div>

        {/* PINNED SELECTED ITEM BANNER (Always visible at top, never scrolls off screen!) */}
        <div
          style={{
            padding: '12px 20px',
            background: 'var(--surface-2, rgba(255,255,255,0.04))',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexShrink: 0,
          }}
        >
          {displayImage ? (
            <img
              src={displayImage}
              alt={displayName}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                objectFit: 'cover',
                boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                border: '1.5px solid rgba(255,255,255,0.1)',
                flexShrink: 0,
              }}
            />
          ) : (
            <span style={{ fontSize: '2rem', flexShrink: 0 }}>🍽️</span>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3
                style={{
                  fontSize: '1.18rem',
                  fontWeight: 800,
                  color: 'var(--text)',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '-0.3px',
                }}
              >
                {displayName}
              </h3>
              {currentItem?.price && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    background: 'var(--primary-light, rgba(16,185,129,0.12))',
                    padding: '2px 8px',
                    borderRadius: 10,
                  }}
                >
                  ₹{parseFloat(currentItem.price).toFixed(2)}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
              {isUpdatingExisting
                ? 'Editing your previous rating & review'
                : 'Share your dining feedback for this dish'}
            </p>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="panel-body" style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Quick Selectable Dish Chips (Requested: No dropdown) */}
          {!initialReview && !orderItem && selectableItems.length > 1 && (
            <div style={{ marginBottom: '14px' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Select Dish to Review:</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)' }}>
                  Tap to switch
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  flexWrap: 'nowrap',
                  paddingBottom: '4px',
                  scrollbarWidth: 'thin',
                }}
              >
                {selectableItems.map((item) => {
                  const isSelected =
                    (selectedFoodId && String(item.id) === String(selectedFoodId)) ||
                    item.name.toLowerCase().trim() === displayName.toLowerCase().trim();

                  return (
                    <button
                      key={item.name + (item.id || '')}
                      type="button"
                      onClick={() => selectFood(item)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '100px',
                        border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--primary-light, rgba(16,185,129,0.18))' : 'var(--surface-2, rgba(255,255,255,0.03))',
                        color: isSelected ? 'var(--primary)' : 'var(--text)',
                        fontSize: '0.78rem',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        flexShrink: 0,
                        transition: 'all 0.15s',
                        boxShadow: isSelected ? '0 2px 6px rgba(16,185,129,0.2)' : 'none',
                      }}
                    >
                      <span>{item.isOrdered ? '⭐' : '🍽️'}</span>
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Informative banner if user previously reviewed this item */}
          {isUpdatingExisting && (
            <div
              style={{
                marginBottom: '12px',
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                color: '#60a5fa',
                fontSize: '0.78rem',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ✏️ You previously reviewed this dish. Submitting will update your existing rating and review.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Interactive 5-Star Rating Selector */}
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <div
                style={{
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px',
                }}
              >
                Your Star Rating (1 – 5 Stars)
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= (hoverRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '2.1rem',
                        cursor: 'pointer',
                        color: active ? '#f59e0b' : 'var(--border-strong, #4b5563)',
                        transition: 'transform 0.15s, color 0.15s',
                        transform: active ? 'scale(1.12)' : 'scale(1)',
                        padding: '1px 3px',
                        lineHeight: 1,
                      }}
                      title={`${star} Star${star > 1 ? 's' : ''}`}
                      aria-label={`${star} star`}
                    >
                      ★
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  textAlign: 'center',
                  fontWeight: 700,
                  color: '#f59e0b',
                  fontSize: '0.86rem',
                  marginTop: '6px',
                }}
              >
                {rating === 5 && '🌟 5 Stars – Excellent! Highly recommended'}
                {rating === 4 && '👍 4 Stars – Very Good! Really enjoyed it'}
                {rating === 3 && '😊 3 Stars – Good! Satisfactory taste'}
                {rating === 2 && '😐 2 Stars – Average, could be better'}
                {rating === 1 && '😞 1 Star – Poor, needs improvement'}
              </div>
            </div>

            {/* Review Comment Field */}
            <div className="form-field" style={{ marginBottom: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <label
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text)',
                  }}
                >
                  Write Your Review <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {comment.trim().length} chars
                </span>
              </div>
              <textarea
                rows={3}
                required
                placeholder={`Write your honest review about ${displayName}'s quality, taste, temperature, portions, and presentation...`}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-md, 10px)',
                  background: 'var(--surface-2, rgba(255,255,255,0.03))',
                  color: 'var(--text)',
                  fontSize: '0.88rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                  lineHeight: 1.45,
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                Empty reviews are not permitted. Please share descriptive feedback.
              </span>
            </div>

            {/* Error banner */}
            {error && (
              <div
                className="panel-error"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                  borderRadius: 'var(--radius-md, 8px)',
                  padding: '9px 12px',
                  fontSize: '0.82rem',
                  marginBottom: '14px',
                  lineHeight: 1.4,
                }}
              >
                ⚠ {error}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                className="panel-btn-secondary"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 'var(--radius-md, 10px)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                }}
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="panel-btn-primary"
                style={{
                  flex: 1.8,
                  padding: '10px',
                  borderRadius: 'var(--radius-md, 10px)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
                disabled={isSubmitting || !displayName}
              >
                {isSubmitting
                  ? 'Saving...'
                  : isUpdatingExisting
                  ? 'Update Review ✏️'
                  : 'Submit Review ⭐'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
