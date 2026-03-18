from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    steam_id = models.BigIntegerField(unique=True, null=True, blank=True)

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_pic_url = models.URLField(max_length=2000, blank=True)
    bio = models.TextField(max_length=500, blank=True)

class Server(models.Model):
    name = models.CharField(max_length=64)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_servers')
    users = models.ManyToManyField(User)
    profile_picture = models.ImageField(upload_to='server_pics/', blank=True)

class Channel(models.Model):
    name = models.CharField(max_length=64)
    server = models.ForeignKey(Server, on_delete=models.CASCADE, related_name='channels')

class Message(models.Model):
    content = models.TextField(max_length=2000)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='messages')
    timestamp = models.DateTimeField(auto_now_add=True)