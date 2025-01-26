from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Hangout, Idea
from .serializers import HangoutSerializer, IdeaSerializer

@api_view(['POST'])
def create_hangout(request):
    """Create a new hangout and return its link"""
    name = request.data.get('name')
    deadline = request.data.get('deadline')
    hangout = Hangout.objects.create(name=name, deadline=deadline)
    
    # Serialize the hangout and return the data
    serializer = HangoutSerializer(hangout)
    return Response({"link": f"/hangout/{hangout.id}", "hangout": serializer.data})


@api_view(['POST'])
def submit_idea(request, hangout_id):
    """Submit an idea for a hangout"""
    hangout = Hangout.objects.get(id=hangout_id)
    content = request.data.get('content')
    idea = Idea.objects.create(hangout=hangout, content=content)
    
    # Serialize the new idea and return the data
    serializer = IdeaSerializer(idea)
    return Response({"message": "Idea submitted!", "idea": serializer.data})

@api_view(['POST'])
def submit_vote(request, hangout_id):
    """Submit votes for ideas"""
    hangout = Hangout.objects.get(id=hangout_id)
    votes = request.data.get('votes')  # List of idea IDs
    for idea_id in votes:
        idea = Idea.objects.get(id=idea_id, hangout=hangout)
        vote, created = Vote.objects.get_or_create(hangout=hangout, idea=idea)
        vote.count += 1  # Increment vote count
        vote.save()
    
    return Response({"message": "Votes submitted!"})
