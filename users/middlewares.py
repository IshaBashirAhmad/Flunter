from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import user_logged_in, user_logged_out
from django.dispatch import receiver
from django.conf import settings
from django.http import JsonResponse
from django.contrib.sessions.models import Session
from .models import UserSession


class SessionUpdateMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.user.is_authenticated:
            try:
                session = UserSession.objects.get(session_key=request.session.session_key)
                session.update_last_activity()
            except UserSession.DoesNotExist:
                pass