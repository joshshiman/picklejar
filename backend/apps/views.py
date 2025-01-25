from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Hangout, Idea, Vote
from .serializers import HangoutSerializer, IdeaSerializer, VoteSerializer


# Create your views here.

@api_view(['POST'])
def create_hangout(request):
    """Create a new hangout and return its link"""
    title = request.data.get('title')
    deadline = request.data.get('deadline')
    hangout = Hangout.objects.create(title=title, deadline=deadline)
    return Response({"link": f"/hangout/{hangout.id}"})

@api_view(['POST'])
def submit_idea(request, hangout_id):
    """Submit an idea for a hangout"""
    hangout = Hangout.objects.get(id=hangout_id)
    session_id = request.data.get('session_id')
    content = request.data.get('content')
    Idea.objects.create(hangout=hangout, session_id=session_id, content=content)
    return Response({"message": "Idea submitted!"})

@api_view(['POST'])
def submit_vote(request, hangout_id):
    """Submit votes for ideas"""
    hangout = Hangout.objects.get(id=hangout_id)
    session_id = request.data.get('session_id')
    votes = request.data.get('votes')  # List of idea IDs
    for idea_id in votes:
        Vote.objects.create(hangout=hangout, idea_id=idea_id, session_id=session_id)
    return Response({"message": "Votes submitted!"})
