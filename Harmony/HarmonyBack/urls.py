from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserView, RegisterView, CurrentUserView, ProfileUpdateView, GameSuggestionsView, UserServersView, ServerCreateView, ServerChannelsView, ChannelMessagesView, ChannelCreateView, MessageCreateView, ServerUpdateMembersView, UserServersView, ServerCreateView, ServerChannelsView, ChannelMessagesView, ChannelCreateView, MessageCreateView, ServerUpdateMembersView, ServerDeleteView, ServerLeaveView, RefuseGameView,LikeGameView, UserStatsView, SteamGameDetailsView, SendFriendRequestView, PendingRequestsListView, RespondToRequestView, FriendsListView, FriendsUserStatsView

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
    path('channels/<int:channel_id>/messages/', ChannelMessagesView.as_view()),
    path('servers/<int:server_id>/channels/create/', ChannelCreateView.as_view()),
    path('channels/<int:channel_id>/messages/send/', MessageCreateView.as_view()),
    path('servers/<int:pk>/update-members/', ServerUpdateMembersView.as_view()),
    path('games/suggestions/', GameSuggestionsView.as_view(), name='game_suggestions'),
    path('servers/<int:pk>/delete/', ServerDeleteView.as_view()),
    path('servers/<int:pk>/leave/', ServerLeaveView.as_view()),
    path('recommendations/refuse/', RefuseGameView.as_view()),
    path('recommendations/like/', LikeGameView.as_view()),
    path('steam-details/<str:appid>/', SteamGameDetailsView.as_view(), name='steam-details'),
    path('recommendations/stats/', UserStatsView.as_view(), name='user_stats'),
    path('friends/send/', SendFriendRequestView.as_view(), name='send-friend-request'),
    path('friends/pending/', PendingRequestsListView.as_view(), name='pending-friends'),
    path('friends/respond/<int:request_id>/', RespondToRequestView.as_view(), name='respond-friend'),
    path('friends/list/', FriendsListView.as_view(), name='friends-list'),
    path('recommendations/friends-stats/', FriendsUserStatsView.as_view(), name='friend-stats'),
]