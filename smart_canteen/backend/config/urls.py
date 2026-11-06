from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.conf import settings
from django.conf.urls.static import static


def home(request):
    return HttpResponse("Smart Canteen Backend is Running!")

urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),

    # Endpoints supporting both /api/ and /api/v1/
    path("api/accounts/", include("accounts.urls")),
    path("api/menu/", include("menu.urls")),
    path("api/cart/", include("cart.urls")),
    path("api/orders/", include("orders.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/order-queue/", include("order_queue.urls")),
    path("api/queue/", include("order_queue.urls")),
    path("api/favorites/", include("favorites.urls")),
    path("api/reviews/", include("reviews.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/chatbot/", include("chatbot.urls")),
    path("api/tasks/", include("tasks.urls")),

    path("api/v1/accounts/", include("accounts.urls")),
    path("api/v1/menu/", include("menu.urls")),
    path("api/v1/cart/", include("cart.urls")),
    path("api/v1/orders/", include("orders.urls")),
    path("api/v1/payments/", include("payments.urls")),
    path("api/v1/order-queue/", include("order_queue.urls")),
    path("api/v1/queue/", include("order_queue.urls")),
    path("api/v1/favorites/", include("favorites.urls")),
    path("api/v1/reviews/", include("reviews.urls")),
    path("api/v1/notifications/", include("notifications.urls")),
    path("api/v1/reports/", include("reports.urls")),
    path("api/v1/chatbot/", include("chatbot.urls")),
    path("api/v1/tasks/", include("tasks.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)