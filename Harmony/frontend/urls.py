from django.urls import path
from .views import index
urlpatterns = [
    path('', index),
    path('account', index),
    path('login', index),
    path('register', index)
]