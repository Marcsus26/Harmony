from rest_framework import serializers
from .models import User, Server, Profile, Channel, Message

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'steam_id', 'password')