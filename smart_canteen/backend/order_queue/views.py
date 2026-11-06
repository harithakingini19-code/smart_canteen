from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import QueueToken
from .serializers import QueueTokenSerializer
from accounts.permissions import IsStaffRole
from notifications.services import notify_order_status_change


class QueueViewSet(viewsets.ModelViewSet):
    queryset = QueueToken.objects.all()
    serializer_class = QueueTokenSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'advance_status']:
            return [IsStaffRole()]
        return [permissions.AllowAny()]  # Public queue display TV board

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def live_status(self, request):
        """API for live public screen showing currently preparing & ready tokens"""
        preparing = QueueToken.objects.filter(status=QueueToken.Status.PREPARING).order_by('created_at')
        ready = QueueToken.objects.filter(status=QueueToken.Status.READY).order_by('created_at')
        waiting = QueueToken.objects.filter(status=QueueToken.Status.WAITING).order_by('created_at')

        return Response({
            'preparing': QueueTokenSerializer(preparing, many=True).data,
            'ready': QueueTokenSerializer(ready, many=True).data,
            'ready_for_pickup': QueueTokenSerializer(ready, many=True).data,
            'waiting': QueueTokenSerializer(waiting, many=True).data,
            'waiting_count': waiting.count(),
            'estimated_wait_time_minutes': max([t.estimated_wait_time_minutes for t in waiting], default=10)
        })

    @action(detail=True, methods=['patch'], permission_classes=[IsStaffRole])
    def advance_status(self, request, pk=None):
        token = self.get_object()
        new_status = request.data.get('status')
        if new_status in QueueToken.Status.values:
            token.status = new_status
            token.save()

            # Sync order status
            order = token.order
            if new_status == QueueToken.Status.PREPARING:
                order.status = 'PREPARING'
            elif new_status == QueueToken.Status.READY:
                order.status = 'READY_FOR_PICKUP'
            elif new_status == QueueToken.Status.PICKED_UP:
                order.status = 'COMPLETED'
            elif new_status == QueueToken.Status.CANCELLED:
                order.status = 'CANCELLED'
            order.save()

            notify_order_status_change(order)

            return Response(QueueTokenSerializer(token).data)
        return Response({'error': 'Invalid status choice'}, status=status.HTTP_400_BAD_REQUEST)
