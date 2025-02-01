from django.db import models
import uuid
from django.utils.timezone import now

class HangoutStatus(models.TextChoices):
    IDEA_COLLECTION = "idea collection"
    VOTING = "voting"
    COMPLETED = "completed"

class Hangout(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    submission_deadline = models.DateTimeField()
    voting_deadline = models.DateTimeField()
    status = models.CharField(
        max_length=50, choices=HangoutStatus.choices, default=HangoutStatus.IDEA_COLLECTION
    )
    created_at = models.DateTimeField(auto_now_add=True)

class Participant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hangout = models.ForeignKey(Hangout, on_delete=models.CASCADE)
    email = models.EmailField()

class Idea(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hangout = models.ForeignKey(Hangout, on_delete=models.CASCADE)
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE, unique=True)
    text = models.TextField()
    vote_count = models.IntegerField(default=0)

class Vote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participant = models.ForeignKey(Participant, on_delete=models.CASCADE)
    idea = models.ForeignKey(Idea, on_delete=models.CASCADE)
    votes = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('participant', 'idea')