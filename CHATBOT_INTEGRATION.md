# Smart Canteen — Chatbot & 10-Minute Cancellation Timer Integration Guide

This guide explains how the AI Chatbot and 10-minute Order Cancellation Timer work and how they connect to your existing React frontend and Django backend.

---

## 📁 Files Created & Modified

### 🔹 React Frontend (`src/`)
| File | Purpose |
|------|---------|
| `src/components/Chatbot/Chatbot.jsx` | Floating chatbot assistant with live Active Order banner, chat flow, and order status tracking |
| `src/components/Chatbot/CancellationTimer.jsx` | 10-minute countdown timer (10:00 → 00:00) with server sync and "Cancel Order" button |
| `src/components/Chatbot/OrderStatusBadge.jsx` | Colored pill badges: `CONFIRMED`, `PREPARING`, `READY`, `CANCELLED` |
| `src/components/Chatbot/chatbot.css` | All styles prefixed with `.sc-chatbot-` to protect existing design |
| `src/services/chatbotApi.js` | API service for chat, cancellation status, cancel action, and `notifyOrderPlaced` helper |

### 🔹 Django Backend (`chatbot/`)
| File | Purpose |
|------|---------|
| `chatbot/views.py` | `ChatbotView`, `CancellationStatusView`, and `CancelOrderView` with server-side validation |
| `chatbot/models.py` | `ChatSession` and `ChatMessage` models |
| `chatbot/serializers.py` | Serializers including `CancellationStatusSerializer` with `created_at` support |
| `chatbot/urls.py` | URL routes for `/api/chatbot/` |
| `chatbot/admin.py` | Admin panel registrations |

---

## 🚀 How to Show the 10-Minute Timer Immediately After Placing an Order

### Method A: Connect from your existing Food Ordering / Checkout component (Recommended)

In your existing checkout or order placement function where your order API is called:

```javascript
import { notifyOrderPlaced } from './services/chatbotApi';

// Example: Inside your existing handlePlaceOrder / checkout function:
const handleCheckout = async () => {
  const response = await api.post('/api/orders/', cartData); // your existing order API
  const newOrder = response.data; // e.g. { id: 101, created_at: "2026-10-23T15:20:00Z", status: "CONFIRMED" }

  // 🔔 Add this single line:
  notifyOrderPlaced(newOrder);
};
```

**What happens:**
1. `notifyOrderPlaced` stores the order in `localStorage` and emits an event.
2. The `<Chatbot />` component automatically opens up and displays:
   - Pinned **Active Order #101** card at the top.
   - An **Order Confirmed** badge.
   - The live **10:00 → 00:00 countdown timer**.
   - An active **✖ Cancel Order** button.

---

### Method B: Render `<CancellationTimer />` directly on your Order Confirmation / Order Details page

You can also display the countdown timer directly inside your existing order success screen or order history:

```jsx
import CancellationTimer from './components/Chatbot/CancellationTimer';
import OrderStatusBadge from './components/Chatbot/OrderStatusBadge';

function OrderDetailsPage({ order }) {
  return (
    <div className="order-details">
      <h3>Order #{order.id}</h3>
      
      {/* Status badge */}
      <OrderStatusBadge status={order.status} />

      {/* 10-Minute Cancellation Timer */}
      <CancellationTimer
        orderId={order.id}
        createdAt={order.created_at}
        orderStatus={order.status}
        onCancelled={() => {
          alert('Order was cancelled successfully!');
          // Refresh order data or update status
        }}
      />
    </div>
  );
}
```

---

### Method C: Check & Cancel via the Chatbot conversation

Students and faculty can simply open the Chatbot and ask:
- *"What is the status of order 42?"*
- *"Cancel order 42"*
- Or simply enter their Order ID: *"42"*

The Chatbot will look up the order in the database and display:
- Real-time status (Confirmed / Preparing / Ready / Cancelled).
- The live countdown timer.
- The cancel button if within the 10-minute window.

---

## 🔒 Backend Cancellation Rules Enforced in Django

All cancellation rules are strictly validated on the Django backend in `chatbot/views.py`:

1. **10-minute deadline validation**:
   - Compares `(timezone.now() - order.created_at).total_seconds()`.
   - If greater than 600 seconds (10 minutes), cancellation is blocked with:
     `"Cancellation time expired. Orders can only be cancelled within 10 minutes of placement."`
2. **Food preparation rule**:
   - If `order.status == 'PREPARING'`, cancellation is blocked with:
     `"Order cannot be cancelled because food preparation has already started."`
3. **Status update**:
   - If both checks pass, `order.status` is updated to `'CANCELLED'` and saved to the database.

---

## 🛠️ Django Backend Setup (3 Quick Steps)

1. **Add `chatbot` to `INSTALLED_APPS`** in your Django `settings.py`:
   ```python
   INSTALLED_APPS = [
       ...
       'rest_framework',
       'chatbot',
   ]
   ```

2. **Add chatbot URLs** to your main project `urls.py`:
   ```python
   from django.urls import path, include

   urlpatterns = [
       ...
       path('api/chatbot/', include('chatbot.urls')),
   ]
   ```

3. **Run database migrations**:
   ```bash
   python manage.py makemigrations chatbot
   python manage.py migrate
   ```

---

## 🧪 How to Test

1. **Test 10-minute countdown**:
   - Place a new order in your app (or pass `{ id: 1, created_at: new Date().toISOString(), status: 'CONFIRMED' }` to `notifyOrderPlaced`).
   - Open the chatbot: you should see the timer start counting down from `10:00`.
   - When under 5 minutes, the timer turns amber/orange.
   - When under 2 minutes, the timer turns red.
2. **Test cancellation**:
   - Click "✖ Cancel Order" while the timer is running.
   - Order status changes to `CANCELLED` on both the backend and frontend.
3. **Test expiration**:
   - When the timer reaches `00:00`, the cancel button is disabled and `“Cancellation time expired.”` is displayed.
4. **Test food preparation guard**:
   - If an order moves to `PREPARING`, the timer disables cancellation and displays that food preparation has started.
