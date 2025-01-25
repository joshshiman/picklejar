from rest_framework import serializers
from .models import Hangout, Idea, Vote

class HangoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hangout
        fields = '__all__'

class IdeaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idea
        fields = '__all__'

class VoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vote
        fields = '__all__'
