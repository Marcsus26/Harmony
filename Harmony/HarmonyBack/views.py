from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, RegisterSerializer, ProfileSerializer
from .models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated] # Only logged-in users allowed

    def get(self, request):
        # request.user is automatically populated by the JWT token
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def patch(self, request):
        # 'partial=True' allows you to update JUST the steam_id 
        # without sending username/email every time.
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

class UserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

class ProfileUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # This ensures a user can only edit THEIR own profile
        return self.request.user.profile