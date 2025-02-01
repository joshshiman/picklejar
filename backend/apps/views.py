from datetime import datetime, timedelta
from django.utils.timezone import make_aware
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Hangout, Idea, Participant, Vote, HangoutStatus
from .serializers import HangoutSerializer, IdeaSerializer

@api_view(['POST'])
def create_hangout(request):
    """Create a new hangout with participants and return links"""
    name = request.data.get('name')
    submission_deadline_str = request.data.get('submission_deadline')
    emails = request.data.get('emails', [])

    try:
        submission_deadline = make_aware(datetime.fromisoformat(submission_deadline_str))
    except ValueError:
        return Response({"message": "Invalid datetime format"}, status=400)
    
    voting_deadline = submission_deadline + timedelta(days=7)
    
    hangout = Hangout.objects.create(
        name=name,
        submission_deadline=submission_deadline,
        voting_deadline=voting_deadline
    )
    
    participants = []
    for email in emails:
        participant = Participant.objects.create(hangout=hangout, email=email)
        participants.append(participant)
    
    base_url = "http://localhost:8000"
    links = [f"{base_url}/hangout/{hangout.id}/{p.id}" for p in participants]
    
    return Response({
        "hangout": HangoutSerializer(hangout).data,
        "participant_links": links
    })

@api_view(['POST'])
def submit_idea(request, hangout_id, participant_id):
    """Submit an idea for a hangout (one per participant)"""
    participant = get_object_or_404(Participant, id=participant_id, hangout_id=hangout_id)
    
    if Idea.objects.filter(participant=participant).exists():
        return Response({"message": "Already submitted an idea"}, status=400)
    
    text = request.data.get('text')
    if not text:
        return Response({"message": "Idea text required"}, status=400)
    
    idea = Idea.objects.create(
        hangout=participant.hangout,
        participant=participant,
        text=text
    )
    return Response(IdeaSerializer(idea).data)

@api_view(['POST'])
def submit_votes(request, participant_id):
    """Handle vote distribution (max 5 votes per participant)"""
    participant = get_object_or_404(Participant, id=participant_id)
    hangout = participant.hangout
    
    if hangout.status != HangoutStatus.VOTING:
        return Response({"message": "Voting not active"}, status=400)
    
    votes_data = request.data.get('votes', {})
    total_votes = sum(votes_data.values())
    
    if total_votes > 5:
        return Response({"message": "Max 5 votes allowed"}, status=400)
    
    # Clear existing votes
    Vote.objects.filter(participant=participant).delete()
    
    # Create new votes and update counts
    for idea_id, votes in votes_data.items():
        idea = get_object_or_404(Idea, id=idea_id, hangout=hangout)
        Vote.objects.create(participant=participant, idea=idea, votes=votes)
        idea.vote_count += votes
        idea.save()
    
    return Response({"message": "Votes submitted"})