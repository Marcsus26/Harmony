from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, RegisterSerializer
from .models import User
from rest_framework.response import Response

class UserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer