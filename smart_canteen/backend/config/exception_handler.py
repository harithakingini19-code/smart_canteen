import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.db import OperationalError, ProgrammingError

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler that:
    1. Logs all unhandled errors with traceback for debugging
    2. Converts DB errors (missing table, connection issues) to proper JSON 500
       instead of leaking HTML debug pages
    3. Falls back to the default DRF exception handler for known API errors
    """
    # Handle database errors explicitly — these cause 500s when tables don't exist
    if isinstance(exc, (OperationalError, ProgrammingError)):
        logger.exception(
            "Database error in view %s: %s",
            context.get('view', 'unknown'),
            exc,
        )
        return Response(
            {'error': 'A database error occurred. The backend may still be initialising — please try again in a moment.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Let DRF handle its own known exceptions (401, 403, 404, validation errors, etc.)
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception — log it and return a safe JSON 500
        logger.exception(
            "Unhandled exception in view %s: %s",
            context.get('view', 'unknown'),
            exc,
        )
        return Response(
            {'error': 'An unexpected server error occurred. Please try again later.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
