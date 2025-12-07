from django.db import models
import uuid

# Enum for status choices
class HangoutStatus(models.TextChoices):
    IDEA_COLLECTION = "idea collection"
    VOTING = "voting"
    COMPLETED = "completed"

# Hangouts Model
class Hangout(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    submission_deadline = models.DateTimeField(null=True)
    voting_deadline = models.DateTimeField(null=True)
    status = models.CharField(
        max_length=50, choices=HangoutStatus.choices, default=HangoutStatus.IDEA_COLLECTION
    )
    created_at = models.DateTimeField(auto_now_add=True)

# Ideas Model
class Idea(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hangout = models.ForeignKey(Hangout, on_delete=models.CASCADE)
    text = models.TextField()
    vote_count = models.IntegerField(default=0)

