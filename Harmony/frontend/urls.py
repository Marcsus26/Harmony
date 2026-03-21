from django.urls import path
from .views import index
urlpatterns = [
    path('', index),
    path('steam-settings', index),
    path('login', index),
    path('register', index),
    path('profile', index)
]