from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserView, RegisterView

urlpatterns = [
    path('', UserView.as_view()),
    path('/register/', RegisterView.as_view(), name='auth_register'),
    path('/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]