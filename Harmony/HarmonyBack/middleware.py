from django.utils import timezone
from .models import User

# middleware.py
class UpdateLastSeenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            user = request.user
            user.last_seen = timezone.now()
            user.save(update_fields=['last_seen']) # Saves ONLY this field
        
        return self.get_response(request)