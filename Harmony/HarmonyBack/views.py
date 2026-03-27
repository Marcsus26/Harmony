from django.shortcuts import render
from django.http import HttpResponse
from pathlib import Path
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, RegisterSerializer, ProfileSerializer, ServerSerializer, ServerCreateSerializer, ChannelSerializer, MessageSerializer, ServerSerializer, ServerCreateSerializer, ChannelSerializer, MessageSerializer
from .models import User, Server, Channel, Message, Server, Channel, Message, RefusedGame, FriendRequest
from .suggestion_games import get_top_5_recommendations, create_user_pref_dict 
from .suggestion_games_KNN import get_knn_recommendations
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import requests
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

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
    
class ChannelCreateView(generics.CreateAPIView):
    serializer_class = ChannelSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Grab the server_id from the URL and link the channel to it
        server = Server.objects.get(id=self.kwargs['server_id'])
        serializer.save(server=server)


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
            recommendations = get_knn_recommendations(steam_id, csv_path, rejected_appids=rejected_ids)
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
        self.request.user.last_seen = timezone.now()
        self.request.user.save(update_fields=['last_seen'])
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
        self.request.user.last_seen = timezone.now()
        self.request.user.save(update_fields=['last_seen'])
        server = Server.objects.get(id=self.kwargs['server_id'])
        serializer.save(server=server)

class MessageCreateView(generics.CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        self.request.user.last_seen = timezone.now()
        self.request.user.save(update_fields=['last_seen'])
        channel = Channel.objects.get(id=self.kwargs['channel_id'])
        serializer.save(author=self.request.user, channel=channel)

class ServerUpdateMembersView(generics.UpdateAPIView):
    queryset = Server.objects.all()
    serializer_class = ServerCreateSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        server = self.get_object()
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
        
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
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
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
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
        if not game_id:
            return Response({"error": "game_id is required"}, status=400)
            
        # Create the refusal record
        RefusedGame.objects.get_or_create(user=request.user, game_id=str(game_id))
        
        return Response({"status": "Game dismissed"}, status=200)

class SteamGameDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, appid):
        appid_str = str(appid)
        url = f"https://store.steampowered.com/api/appdetails?appids={appid_str}"
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
        
        try:
            response = requests.get(url, timeout=5)
            data = response.json()

            if data and data.get(appid_str, {}).get('success'):
                game_info = data[appid_str]['data']
                movies = game_info.get('movies', [])
                
                # We specifically target the HLS stream from your JSON
                trailer_url = movies[0].get('hls_h264') if movies else None
                
                return Response({
                    "name": game_info.get('name'),
                    "trailer_url": trailer_url, # This will be the .m3u8 link
                }, status=status.HTTP_200_OK)
            
            return Response({"error": "Game not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        steam_id = request.user.steam_id
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
        if not steam_id:
            return Response({"detail": "Steam ID manquant"}, status=400)

        csv_path = Path(__file__).resolve().parent / "steamspy_details_cleaned.csv"

        try:
            # 1. Récupère le dictionnaire des préférences (ex: {'Action': 45.2, 'RPG': 30.1...})
            prefs = create_user_pref_dict(steam_id, csv_path)
            
            if not prefs:
                return Response([], status=200)

            # 2. Formater pour Recharts (Hexagone = 6 genres max)
            # On prend les 6 premiers et on normalise un peu les noms si besoin
            radar_data = []
            for genre, score in list(prefs.items())[:6]:
                radar_data.append({
                    "subject": genre,      # Le nom affiché sur la pointe de l'hexagone
                    "A": round(score, 1),  # La valeur (distance par rapport au centre)
                    "fullMark": 100        # Référence optionnelle
                })

            return Response(radar_data, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

class SendFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]
    User = get_user_model()

    def post(self, request):
        target_username = request.data.get('username')
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
        
        if not target_username:
            return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            to_user = User.objects.get(username=target_username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        if to_user == request.user:
            return Response({"error": "You cannot add yourself, you're already your own best friend!"}, 
                            status=status.HTTP_400_BAD_REQUEST)

        # Create the request
        obj, created = FriendRequest.objects.get_or_create(
            from_user=request.user,
            to_user=to_user
        )

        if not created:
            return Response({"error": "Friend request already sent or exists"}, 
                            status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": f"Friend request sent to {target_username}"}, status=status.HTTP_201_CREATED)
    
class PendingRequestsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # We only want requests sent TO the current user that are still 'Pending' (status=1)
        pending = FriendRequest.objects.filter(to_user=request.user, status=1)
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
        
        # Simple data return (you could also use a Serializer here)
        data = [{
            "id": req.id,
            "from_user": req.from_user.username,
            "timestamp": req.timestamp
        } for req in pending]
        
        return Response(data, status=status.HTTP_200_OK)

class RespondToRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        action = request.data.get('action') 
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
        
        try:
            friend_request = FriendRequest.objects.get(id=request_id, to_user=request.user)
        except FriendRequest.DoesNotExist:
            return Response({"error": "Request not found"}, status=status.HTTP_404_NOT_FOUND)

        if action == 'accept':
            with transaction.atomic():
                friend_request.status = 2 # Accepted
                friend_request.save()
                
                request.user.friends.add(friend_request.from_user)
            
            return Response({"message": "Friend added successfully!"}, status=status.HTTP_200_OK)
            
        elif action == 'reject':
            friend_request.status = 3 # Rejected
            friend_request.save()
            return Response({"message": "Request declined."})
            
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
    
class FriendsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
        friends = request.user.friends.all()
        data = [{
            "id": friend.id,
            "username": friend.username,
            "steam_id": friend.steam_id,
            "avatar": friend.profile.profile_pic_url,
            "is_online": friend.is_online,
            "bio": friend.profile.bio,
        } for friend in friends]
        
        return Response(data)
    
class FriendsUserStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        csv_path = Path(__file__).resolve().parent / "steamspy_details_cleaned.csv"

        try:
            radar_data_all = []
            for friend in request.user.friends.all():
                prefs = create_user_pref_dict(friend.steam_id, csv_path)
                
                if not prefs:
                    return Response([], status=200)

                radar_data = []
                for genre, score in list(prefs.items())[:6]:
                    radar_data.append({
                        "subject": genre,
                        "A": round(score, 1),
                        "fullMark": 100
                    })
                radar_data.append({'id': friend.id})
                radar_data_all.append(radar_data)
            return Response(radar_data_all, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)