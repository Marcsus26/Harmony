from django.shortcuts import render
from django.http import HttpResponse
from pathlib import Path
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, RegisterSerializer, ProfileSerializer, ServerSerializer, ServerCreateSerializer, ChannelSerializer, MessageSerializer, ServerSerializer, ServerCreateSerializer, ChannelSerializer, MessageSerializer
from .models import User, Server, Channel, Message, Server, Channel, Message, RefusedGame
from .suggestion_games import get_top_5_recommendations
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
    
class ChannelMessagesView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(channel_id=self.kwargs['channel_id'])
    
class ChannelCreateView(generics.CreateAPIView):
    serializer_class = ChannelSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Grab the server_id from the URL and link the channel to it
        server = Server.objects.get(id=self.kwargs['server_id'])
        serializer.save(server=server)

class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        channel = Channel.objects.get(id=self.kwargs['channel_id'])
        serializer.save(author=self.request.user, channel=channel)

class ServerUpdateMembersView(generics.UpdateAPIView):
    queryset = Server.objects.all()
    serializer_class = ServerCreateSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        server = self.get_object()
        
        if server.owner != request.user:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        user_ids = request.data.get('users', [])
        
        owner_id = request.user.id
        if owner_id not in user_ids:
            user_ids.append(owner_id)

        request.data['users'] = user_ids

        return self.partial_update(request, *args, **kwargs)


class GameSuggestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        steam_id = request.user.steam_id
        if not steam_id:
            return Response(
                {"detail": "No Steam ID linked to this account.", "results": []},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        rejected_strings = RefusedGame.objects.filter(user=request.user).values_list('game_id', flat=True)
        
        rejected_ids = [int(gid) for gid in rejected_strings]

        csv_path = Path(__file__).resolve().parent / "steamspy_details_cleaned.csv"

        try:
            recommendations = get_top_5_recommendations(steam_id, csv_path, rejected_appids=rejected_ids)
            payload = recommendations.reset_index().rename(columns={"index": "appid"}).to_dict(orient='records')
            return Response({"results": payload}, status=status.HTTP_200_OK)
        except Exception as exc:
            return Response(
                {"detail": f"Failed to build recommendations: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    
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
    
class ChannelMessagesView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(channel_id=self.kwargs['channel_id'])
    
class ChannelCreateView(generics.CreateAPIView):
    serializer_class = ChannelSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Grab the server_id from the URL and link the channel to it
        server = Server.objects.get(id=self.kwargs['server_id'])
        serializer.save(server=server)

class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        channel = Channel.objects.get(id=self.kwargs['channel_id'])
        serializer.save(author=self.request.user, channel=channel)

class ServerUpdateMembersView(generics.UpdateAPIView):
    queryset = Server.objects.all()
    serializer_class = ServerCreateSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        server = self.get_object()
        
        if server.owner != request.user:
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        user_ids = request.data.get('users', [])
        
        owner_id = request.user.id
        if owner_id not in user_ids:
            user_ids.append(owner_id)

        request.data['users'] = user_ids

        return self.partial_update(request, *args, **kwargs)
    
class ServerDeleteView(generics.DestroyAPIView):
    queryset = Server.objects.all()
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        # SECURITY: Ensure only the owner can delete the server
        if instance.owner != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to delete this server.")
        instance.delete()

class ServerLeaveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            server = Server.objects.get(pk=pk)
            
            # If the owner tries to leave, tell them they must delete instead
            if server.owner == request.user:
                return Response(
                    {"detail": "Owners cannot leave their own server. Delete it instead."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Remove the user from the relationship
            server.users.remove(request.user)
            return Response({"detail": "Successfully left the server"}, status=status.HTTP_200_OK)
            
        except Server.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
class RefuseGameView(APIView):
    def post(self, request):
        game_id = request.data.get('game_id')
        if not game_id:
            return Response({"error": "game_id is required"}, status=400)
            
        # Create the refusal record
        RefusedGame.objects.get_or_create(user=request.user, game_id=str(game_id))
        
        return Response({"status": "Game dismissed"}, status=200)