from rest_framework import serializers
from .models import User, Server, Profile, Channel, Message
from django.contrib.auth import get_user_model

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['profile_pic_url', 'bio']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'steam_id', 'profile']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'email', 'steam_id']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class ServerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Server
        fields = ['id', 'name', 'owner', 'icon_url']

class ServerCreateSerializer(serializers.ModelSerializer):
    User = get_user_model()
    users = serializers.PrimaryKeyRelatedField(many=True, queryset=User.objects.all(), required=False)

    class Meta:
        model = Server
        fields = ['id', 'name', 'icon_url', 'users']

class ChannelSerializer(serializers.ModelSerializer):
    # We include the server ID as a read-only field
    server = serializers.ReadOnlyField(source='server.id')

    class Meta:
        model = Channel
        fields = ['id', 'name', 'server']