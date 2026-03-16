from django.db import models

# Create your models here.
class User(models.Model):
    Username = models.CharField(max_length=32, unique=True, primary_key=True)
    SteamId = models.IntegerField(unique=True)
    Password = models.CharField(max_length=64, unique=False)

class UserInfo(models.Model):
    Username = models.CharField(max_length=32, unique=True, primary_key=True)
    ProfilePicURL = models.TextField(max_length=2000, unique=False)
    Bio = models.TextField(max_length=500, unique=False)

class Server(models.Model):
    Id = models.IntegerField(unique=True, primary_key=True)
    Name = models.CharField(max_length=64, unique=False)
    OwnerUsername = models.CharField(max_length=32, unique=False)
    ProfilePicture = models.FileField()

class Channel(models.Model):
    Id = models.IntegerField(unique=True, primary_key=True)
    ChannelName = models.CharField(max_length=64)
    ServerId = models.ForeignKey(Server, on_delete=models.CASCADE)

class Message(models.Model):
    Id = models.IntegerField(unique=True, primary_key=True)
    Content = models.TextField(max_length=500)
    Author = models.ForeignKey(User, on_delete=models.CASCADE)
    ServerSent = models.ForeignKey(Server, on_delete=models.CASCADE)
    ChannelSent = models.ForeignKey(Channel, on_delete=models.CASCADE)
    Date = models.DateTimeField(auto_now_add=True)


