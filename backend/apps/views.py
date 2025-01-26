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

@api_view(['POST', 'DELETE'])
def add_or_remove_vote(request, idea_id):
    """Add or remove a vote from an idea."""
    try:
        idea = Idea.objects.get(id=idea_id)
    except Idea.DoesNotExist:
        return Response({"message": "Idea not found!"}, status=404)
    
    if request.method == 'POST':
        # Increment vote count
        idea.vote_count += 1
        idea.save()
        return Response({"message": "Vote added!", "vote_count": idea.vote_count})
    
    elif request.method == 'DELETE':
        # Decrement vote count if it's greater than 0
        if idea.vote_count > 0:
            idea.vote_count -= 1
            idea.save()
            return Response({"message": "Vote removed!", "vote_count": idea.vote_count})
        else:
            return Response({"message": "Cannot remove vote. Vote count is already 0."}, status=400)

