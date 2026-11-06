import React from 'react';

/**
 * OrderStatusBadge
 * Renders a colored pill badge for a given order status.
 *
 * Props:
 *   status    {string}  - One of: CONFIRMED, PREPARING, READY, CANCELLED, PENDING
 *   className {string}  - Optional extra class names
 */

const STATUS_ICONS = {
  CONFIRMED:  '✔',
  PREPARING:  '🍳',
  READY:      '✅',
  CANCELLED:  '✖',
  PENDING:    '⏳',
};

const STATUS_LABELS = {
  CONFIRMED:  'Confirmed',
  PREPARING:  'Preparing',
  READY:      'Ready',
  CANCELLED:  'Cancelled',
  PENDING:    'Pending',
};

function OrderStatusBadge({ status, className = '' }) {
  // Normalise to uppercase to be resilient against lowercase values from API
  const normalisedStatus = status ? status.toUpperCase() : 'PENDING';

  const icon  = STATUS_ICONS[normalisedStatus]  ?? '●';
  const label = STATUS_LABELS[normalisedStatus] ?? normalisedStatus;

  return (
    <span
      className={`sc-chatbot-status-badge sc-chatbot-status-${normalisedStatus} ${className}`}
      title={`Order status: ${label}`}
      aria-label={`Order status: ${label}`}
    >
      <span className="sc-chatbot-status-dot" aria-hidden="true" />
      <span className="sc-chatbot-status-icon" aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}

export default OrderStatusBadge;
