from rest_framework import serializers
from .models import Hangout, Idea

class HangoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hangout
        fields = '__all__'

class IdeaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idea
        fields = '__all__'

