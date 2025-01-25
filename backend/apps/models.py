from django.db import models

# Create your models here.
class Hangout(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

class Idea(models.Model):
    hangout = models.ForeignKey(Hangout, on_delete=models.CASCADE)
    text = models.TextField()

class Vote(models.Model):
    idea = models.ForeignKey(Idea, on_delete=models.CASCADE)
    count = models.IntegerField(default=0)
