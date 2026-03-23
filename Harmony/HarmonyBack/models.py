from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

class User(AbstractUser):
    steam_id = models.BigIntegerField(unique=True, null=True, blank=True)
    friends = models.ManyToManyField("self", symmetrical=True, blank=True)

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_pic_url = models.URLField(max_length=2000, blank=True)
    bio = models.TextField(max_length=500, blank=True)

class Server(models.Model):
    name = models.CharField(max_length=64)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_servers')
    icon_url = models.URLField(blank=True, null=True)
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='joined_servers')
    def __str__(self):
        return self.name

class Channel(models.Model):
    name = models.CharField(max_length=64)
    server = models.ForeignKey(Server, on_delete=models.CASCADE, related_name='channels')

class Message(models.Model):
    content = models.TextField(max_length=2000)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    channel = models.ForeignKey(Channel, on_delete=models.CASCADE, related_name='messages')
    timestamp = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['timestamp']

class FriendRequest(models.Model):
    from_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='sent_requests'
    )
    to_user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='received_requests'
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevents sending multiple requests to the same person
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"{self.from_user} to {self.to_user}"