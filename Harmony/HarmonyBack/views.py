from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, RegisterSerializer, ProfileSerializer, ServerSerializer, ServerCreateSerializer, ChannelSerializer
from .models import User, Server, Channel
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
    
class UserServersView(generics.ListAPIView):
    serializer_class = ServerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Server.objects.filter(users=self.request.user)
    
class ServerCreateView(generics.CreateAPIView):
    serializer_class = ServerCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        server = serializer.save(owner=self.request.user)
        server.users.add(self.request.user)
        Channel.objects.create(
            name="general", 
            server=server
        )

class ServerChannelsView(generics.ListAPIView):
    serializer_class = ChannelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Grab the server ID from the URL
        server_id = self.kwargs['server_id']
        return Channel.objects.filter(server_id=server_id)