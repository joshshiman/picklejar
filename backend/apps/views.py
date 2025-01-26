from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Hangout, Idea, Vote
from .serializers import HangoutSerializer, IdeaSerializer, VoteSerializer


@api_view(['GET'])
def get_hangout(request, hangout_id):
    """Retrieve a hangout by its ID"""
    try:
        hangout = Hangout.objects.get(id=hangout_id)
    except Hangout.DoesNotExist:
        return Response({"error": "Hangout not found."}, status=404)

    # Serialize the hangout object
    serializer = HangoutSerializer(hangout)
    return Response(serializer.data)


@api_view(['POST'])
def create_hangout(request):
    """Create a new hangout and return its link"""
    name = request.data.get('name')
    deadline = request.data.get('deadline')
    hangout = Hangout.objects.create(name=name, deadline=deadline)
    
    # Serialize the hangout and return the data
    serializer = HangoutSerializer(hangout)
    return Response({"link": f"/hangout/{hangout.id}", "hangout": serializer.data})


@api_view(['GET'])
def get_idea(request, hangout_id, idea_id):
    """Retrieve an idea by its ID for a specific hangout"""
    try:
        hangout = Hangout.objects.get(id=hangout_id)
    except Hangout.DoesNotExist:
        return Response({"error": "Hangout not found."}, status=404)

    try:
        idea = Idea.objects.get(id=idea_id, hangout=hangout)
    except Idea.DoesNotExist:
        return Response({"error": "Idea not found."}, status=404)

    # Serialize the idea object
    serializer = IdeaSerializer(idea)
    return Response(serializer.data)


@api_view(['POST'])
def submit_idea(request, hangout_id):
    """Submit an idea for a hangout"""
    hangout = Hangout.objects.get(id=hangout_id)
    content = request.data.get('content')
    idea = Idea.objects.create(hangout=hangout, session_id=session_id, content=content)
    
    # Serialize the new idea and return the data
    serializer = IdeaSerializer(idea)
    return Response({"message": "Idea submitted!", "idea": serializer.data})


@api_view(['GET'])
def get_vote(request, hangout_id, idea_id, vote_id):
    """Retrieve a vote by its ID for a specific hangout and idea"""
    try:
        hangout = Hangout.objects.get(id=hangout_id)
    except Hangout.DoesNotExist:
        return Response({"error": "Hangout not found."}, status=404)

    try:
        idea = Idea.objects.get(id=idea_id, hangout=hangout)
    except Idea.DoesNotExist:
        return Response({"error": "Idea not found."}, status=404)

    try:
        vote = Vote.objects.get(id=vote_id, hangout=hangout, idea=idea)
    except Vote.DoesNotExist:
        return Response({"error": "Vote not found."}, status=404)

    # Serialize the vote object
    serializer = VoteSerializer(vote)
    return Response(serializer.data)


@api_view(['POST'])
def submit_vote(request, hangout_id):
    """Submit votes for ideas"""
    hangout = Hangout.objects.get(id=hangout_id)
    votes = request.data.get('votes')  # List of idea IDs
    for idea_id in votes:
        idea = Idea.objects.get(id=idea_id, hangout=hangout)
        vote, created = Vote.objects.get_or_create(hangout=hangout, idea=idea, session_id=session_id)
        vote.count += 1  # Increment vote count
        vote.save()
    
    return Response({"message": "Votes submitted!"})
