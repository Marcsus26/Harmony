import pandas as pd
from pathlib import Path
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
from .suggestion_players import get_recently_played_games, calculate_player_similarity
from django.db.models import Q

def get_game_genres(game_id):
    """Fonction utilitaire pour récupérer la liste des genres d'un jeu depuis le CSV"""
    csv_path = Path(__file__).resolve().parent / "steamspy_details_cleaned.csv"
    try:
        df = pd.read_csv(csv_path)
        game_row = df[df['appid'] == int(game_id)]
        if not game_row.empty:
            genre_str = game_row.iloc[0]['genre']
            # Retourne une liste de genres, ex: ['Action', 'RPG']
            return [g.strip() for g in str(genre_str).split(',')]
    except Exception:
        pass
    return []

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


class LikeGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        game_id = request.data.get('game_id')
        if not game_id:
            return Response({"error": "game_id is required"}, status=400)
            
        genres = get_game_genres(game_id)
        profile = request.user.profile
        
        # Initialise le vecteur s'il est vide
        if not profile.genre_vector:
            profile.genre_vector = {}
        
        # Transformez le dictionnaire temporairement pour être sûr que Django voit le changement
        new_vector = dict(profile.genre_vector)
            
        # Augmente de +10 le score pour chaque genre
        for genre in genres:
            new_vector[genre] = new_vector.get(genre, 0) + 10
            
        profile.genre_vector = new_vector
        profile.save()
        
        # (Optionnel) Sauvegarder dans un modèle `LikedGame` si vous voulez garder l'historique
        
        return Response({"status": "Game liked", "new_vector": profile.genre_vector}, status=200)



class LikeGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        game_id = request.data.get('game_id')
        if not game_id:
            return Response({"error": "game_id is required"}, status=400)
            
        genres = get_game_genres(game_id)
        profile = request.user.profile
        
        # Initialise le vecteur s'il est vide
        if not profile.genre_vector:
            profile.genre_vector = {}
        
        # Transformez le dictionnaire temporairement pour être sûr que Django voit le changement
        new_vector = dict(profile.genre_vector)
            
        # Augmente de +10 le score pour chaque genre
        for genre in genres:
            new_vector[genre] = new_vector.get(genre, 0) + 10
            
        profile.genre_vector = new_vector
        profile.save()
        
        # (Optionnel) Sauvegarder dans un modèle `LikedGame` si vous voulez garder l'historique
        
        return Response({"status": "Game liked", "new_vector": profile.genre_vector}, status=200)

class RefuseGameView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        game_id = request.data.get('game_id')
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])
        if not game_id:
            return Response({"error": "game_id is required"}, status=400)
            
        genres = get_game_genres(game_id)
        profile = request.user.profile
        
        if not profile.genre_vector:
            profile.genre_vector = {}
        
        new_vector = dict(profile.genre_vector)
            
        # Diminue de -1 le score pour chaque genre
        for genre in genres:
            new_vector[genre] = max(0, new_vector.get(genre, 0) - 10)
            
        profile.genre_vector = new_vector
        profile.save()
            
        RefusedGame.objects.get_or_create(user=request.user, game_id=str(game_id))
        
        return Response({"status": "Game dismissed", "new_vector": profile.genre_vector}, status=200)


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
        profile = request.user.profile
        
        # Si le vecteur en BDD est vide, on l'initialise une 1ère fois avec Steam
        if not profile.genre_vector and steam_id:
            csv_path = Path(__file__).resolve().parent / "steamspy_details_cleaned.csv"
            prefs = create_user_pref_dict(steam_id, csv_path)
            profile.genre_vector = prefs
            profile.save()

        # Prendre les 6 genres avec les meilleurs scores pour le Radar Chart
        prefs = profile.genre_vector
        if not prefs:
            return Response([], status=200)

        # Trier le dict par score décroissant et prendre les 6 premiers
        top_genres = sorted(prefs.items(), key=lambda item: item[1], reverse=True)[:6]

        radar_data = []
        for genre, score in top_genres:
            radar_data.append({
                "subject": genre,
                "A": round(score, 1),
                "fullMark": 100
            })

        return Response(radar_data, status=200)

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
                if not friend.profile.genre_vector:
                    prefs = create_user_pref_dict(friend.steam_id, csv_path)
                else:
                    prefs = friend.profile.genre_vector

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
    
class SuggestedPlayersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Mettre a jour l'activite de l'utilisateur
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=['last_seen'])

        # 2. Recuperer les jeux recents du demandeur
        my_steam_id = request.user.steam_id
        if not my_steam_id:
            return Response({"detail": "Liez votre compte Steam pour voir des suggestions."}, status=400)
            
        my_recent_games = get_recently_played_games(my_steam_id)

        # 3. Identifier les exclus (soi-meme + amis actuels)
        friend_ids = request.user.friends.values_list('id', flat=True)
        exclude_ids = list(friend_ids) + [request.user.id]

        # 4. Recuperer les autres utilisateurs ayant un Steam ID
        potential_matches = User.objects.exclude(id__in=exclude_ids).exclude(steam_id__isnull=True).exclude(steam_id="")

        suggestions = []
        for candidate in potential_matches:
            candidate_games = get_recently_played_games(candidate.steam_id)
            score = calculate_player_similarity(my_recent_games, candidate_games)
            
            suggestions.append({
                "id": candidate.id,
                "username": candidate.username,
                "avatar": candidate.profile.profile_pic_url,
                "is_online": candidate.is_online,
                "similarity_score": round(score * 100, 2) # Score en pourcentage
            })

        # 5. Tri : Online d'abord (True > False), puis Score decroissant
        suggestions.sort(key=lambda x: (x['is_online'], x['similarity_score']), reverse=True)

        return Response(suggestions[:5]) # (limité à 5)