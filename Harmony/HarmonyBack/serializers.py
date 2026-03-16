from rest_framework import serializers
from .models import User, Server, UserInfo, Channel, Message

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('Username', 'SteamId', 'Password')