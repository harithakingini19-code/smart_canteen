import React, { useState, useRef } from 'react';
import './AddFoodItemModal.css';
import { createFoodItem, DEFAULT_CATEGORIES } from '../services/menu';

const PRESET_IMAGES = [
  { label: 'Paneer Roll', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&h=350&fit=crop' },
  { label: 'Chicken Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&h=350&fit=crop' },
  { label: 'Veg Burger', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&h=350&fit=crop' },
  { label: 'Puttu', url: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=500&h=350&fit=crop' },
  { label: 'Fresh Juice', url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&h=350&fit=crop' },
  { label: 'Chocolate Shake', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&h=350&fit=crop' },
  { label: 'Brownies', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&h=350&fit=crop' },
  { label: 'Crispy Samosa', url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&h=350&fit=crop' },
];

export default function AddFoodItemModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('snacks');
  const [price, setPrice] = useState('');
  const [isVegetarian, setIsVegetarian] = useState(true);
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState(12);
  const [isAvailable, setIsAvailable] = useState(true);
  const [quantity, setQuantity] = useState('25');

  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'url' | 'preset'

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }

    setImageFile(file);
    setImageUrl('');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  // Handle preset image selection
  const handleSelectPreset = (url) => {
    setImageUrl(url);
    setImagePreview(url);
    setImageFile(null);
    setErrorMsg('');
  };

  // Handle URL change
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setImagePreview(url);
    setImageFile(null);
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter the food item name.');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setErrorMsg('Please enter a valid price greater than ₹0.');
      return;
    }

    const trimmedQty = String(quantity).trim();
    const numQty = parseInt(trimmedQty, 10);
    if (trimmedQty === '' || isNaN(numQty) || numQty < 0 || !/^\d+$/.test(trimmedQty)) {
      setErrorMsg('Please enter a valid non-negative whole number for Quantity Available (e.g. 10, 25, or 50).');
      return;
    }

    setSaving(true);
    try {
      const created = await createFoodItem({
        name: name.trim(),
        category,
        price: numPrice,
        is_vegetarian: isVegetarian,
        is_available: numQty === 0 ? false : isAvailable,
        quantity_available: numQty,
        preparation_time_minutes: parseInt(prepTime, 10) || 12,
        description: description.trim(),
        imageFile,
        imageUrl: imageFile ? null : (imageUrl.trim() || null),
        imagePreview: imagePreview || null,
      });

      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch (err) {
      console.error('Error adding food item:', err);
      setErrorMsg('Failed to add food item. Please check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-food-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="add-food-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="add-food-header">
          <div className="add-food-title-group">
            <span className="add-food-icon">🍽️</span>
            <div>
              <h2 className="add-food-title">Add New Food Item</h2>
              <p className="add-food-subtitle">
                Item will be published to the customer homepage menu immediately
              </p>
            </div>
          </div>
          <button className="add-food-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="add-food-error-banner">
            <span>⚠️ {errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="add-food-form">
          <div className="add-food-body">
            {/* Left Column: Form Fields */}
            <div className="add-food-fields">
              {/* Food Name */}
              <div className="add-food-form-group">
                <label className="add-food-label" htmlFor="food-name">
                  Food Item Name <span className="req">*</span>
                </label>
                <input
                  id="food-name"
                  type="text"
                  className="add-food-input"
                  placeholder="e.g. Crispy Paneer Kathi Roll"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Category & Price Row */}
              <div className="add-food-row">
                <div className="add-food-form-group flex-1">
                  <label className="add-food-label" htmlFor="food-category">
                    Category <span className="req">*</span>
                  </label>
                  <select
                    id="food-category"
                    className="add-food-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.slug || cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="add-food-form-group flex-1">
                  <label className="add-food-label" htmlFor="food-price">
                    Price (₹) <span className="req">*</span>
                  </label>
                  <div className="add-food-price-wrap">
                    <span className="add-food-currency">₹</span>
                    <input
                      id="food-price"
                      type="number"
                      step="0.5"
                      min="1"
                      className="add-food-input add-food-price-input"
                      placeholder="50.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Veg / Non-Veg Toggle (Mandatory Requirement) */}
              <div className="add-food-form-group">
                <label className="add-food-label">
                  Dietary Type <span className="req">*</span>
                </label>
                <div className="add-food-diet-toggle">
                  <button
                    type="button"
                    className={`add-food-diet-btn veg ${isVegetarian ? 'active' : ''}`}
                    onClick={() => setIsVegetarian(true)}
                  >
                    <span className="diet-dot veg-dot"></span>
                    <span className="diet-text">🌱 Vegetarian (Veg)</span>
                  </button>
                  <button
                    type="button"
                    className={`add-food-diet-btn nonveg ${!isVegetarian ? 'active' : ''}`}
                    onClick={() => setIsVegetarian(false)}
                  >
                    <span className="diet-dot nonveg-dot"></span>
                    <span className="diet-text">🍗 Non-Vegetarian</span>
                  </button>
                </div>
              </div>

              {/* Quantity Available & Prep Time Row */}
              <div className="add-food-row">
                <div className="add-food-form-group flex-1">
                  <label className="add-food-label" htmlFor="food-quantity">
                    Quantity Available <span className="req">*</span>
                  </label>
                  <input
                    id="food-quantity"
                    type="number"
                    min="0"
                    step="1"
                    className="add-food-input"
                    placeholder="e.g. 10, 25, or 50"
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d+$/.test(val)) {
                        setQuantity(val);
                        if (val === '0') {
                          setIsAvailable(false);
                        } else if (parseInt(val, 10) > 0 && !isAvailable) {
                          setIsAvailable(true);
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (['-', '+', '.', 'e', 'E'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    required
                  />
                </div>

                <div className="add-food-form-group flex-1">
                  <label className="add-food-label" htmlFor="food-prep">
                    Est. Prep Time (mins)
                  </label>
                  <input
                    id="food-prep"
                    type="number"
                    min="1"
                    max="120"
                    className="add-food-input"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Availability */}
              <div className="add-food-form-group">
                <label className="add-food-label">Availability</label>
                <label className="add-food-checkbox-card">
                  <input
                    type="checkbox"
                    checked={isAvailable && parseInt(quantity || '0', 10) > 0}
                    disabled={parseInt(quantity || '0', 10) === 0}
                    onChange={(e) => {
                      if (parseInt(quantity || '0', 10) === 0) return;
                      setIsAvailable(e.target.checked);
                    }}
                  />
                  <span>
                    {parseInt(quantity || '0', 10) === 0
                      ? '✕ Out of Stock (Quantity is 0)'
                      : (isAvailable ? '✓ In Stock (Available)' : '✕ Out of Stock')}
                  </span>
                </label>
              </div>

              {/* Description */}
              <div className="add-food-form-group">
                <label className="add-food-label" htmlFor="food-desc">
                  Description
                </label>
                <textarea
                  id="food-desc"
                  rows={3}
                  className="add-food-textarea"
                  placeholder="Delicious dish description, key ingredients, spices..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Right Column: Image Upload & Preview */}
            <div className="add-food-media">
              <label className="add-food-label">
                Food Image <span className="add-food-label-sub">(Upload, Preset, or URL)</span>
              </label>

              {/* Image Preview Box */}
              <div className="add-food-preview-box">
                {imagePreview ? (
                  <div className="add-food-preview-img-wrap">
                    <img
                      src={imagePreview}
                      alt="Food preview"
                      className="add-food-preview-img"
                      onError={() => setErrorMsg('Image preview failed to load. Please verify image source.')}
                    />
                    <button
                      type="button"
                      className="add-food-remove-img"
                      onClick={handleRemoveImage}
                      title="Remove image"
                    >
                      ✕ Remove
                    </button>
                    <span className="add-food-badge-tag">
                      {isVegetarian ? '🌱 Veg' : '🍗 Non-Veg'} • ₹{price || '0'}
                    </span>
                  </div>
                ) : (
                  <div className="add-food-preview-placeholder">
                    <span className="placeholder-icon">📷</span>
                    <span className="placeholder-text">No image selected</span>
                    <span className="placeholder-hint">A photo makes the dish 3× more popular</span>
                  </div>
                )}
              </div>

              {/* Image Source Mode Selector */}
              <div className="add-food-tab-pills">
                <button
                  type="button"
                  className={`pill-btn ${imageMode === 'upload' ? 'active' : ''}`}
                  onClick={() => setImageMode('upload')}
                >
                  📁 Upload File
                </button>
                <button
                  type="button"
                  className={`pill-btn ${imageMode === 'preset' ? 'active' : ''}`}
                  onClick={() => setImageMode('preset')}
                >
                  ✨ Presets
                </button>
                <button
                  type="button"
                  className={`pill-btn ${imageMode === 'url' ? 'active' : ''}`}
                  onClick={() => setImageMode('url')}
                >
                  🔗 Image URL
                </button>
              </div>

              {/* Mode 1: File Upload */}
              {imageMode === 'upload' && (
                <div className="image-mode-section">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="food-image-file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    className="add-food-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📂 Choose Image File from Computer
                  </button>
                  {imageFile && (
                    <span className="upload-file-info">
                      Selected: <strong>{imageFile.name}</strong> ({(imageFile.size / 1024).toFixed(0)} KB)
                    </span>
                  )}
                </div>
              )}

              {/* Mode 2: Presets */}
              {imageMode === 'preset' && (
                <div className="image-mode-section">
                  <span className="preset-sub">Click any dish photo to apply:</span>
                  <div className="preset-grid">
                    {PRESET_IMAGES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        className={`preset-card ${imageUrl === preset.url ? 'active' : ''}`}
                        onClick={() => handleSelectPreset(preset.url)}
                      >
                        <img src={preset.url} alt={preset.label} />
                        <span>{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode 3: Direct URL */}
              {imageMode === 'url' && (
                <div className="image-mode-section">
                  <input
                    type="url"
                    className="add-food-input"
                    placeholder="https://example.com/dish.jpg"
                    value={imageUrl}
                    onChange={handleUrlChange}
                  />
                  <span className="upload-file-info">Paste an image link from Unsplash, Google, etc.</span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="add-food-footer">
            <button type="button" className="add-food-cancel-btn" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="add-food-submit-btn" disabled={saving}>
              {saving ? (
                <>
                  <span className="add-food-spinner" /> Adding Dish…
                </>
              ) : (
                <>➕ Publish Food Item</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
