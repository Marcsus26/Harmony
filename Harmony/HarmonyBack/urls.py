from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserView, RegisterView, CurrentUserView, ProfileUpdateView, UserServersView, ServerCreateView, ServerChannelsView

urlpatterns = [
    path('', UserView.as_view()),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),
    path('profile/update/', ProfileUpdateView.as_view(), name='profile_update'),
    path('servers/my-servers/', UserServersView.as_view(), name="current-user-server"),
    path('servers/create/', ServerCreateView.as_view(), name='server-create'),
    path('servers/<int:server_id>/channels/', ServerChannelsView.as_view()),
]