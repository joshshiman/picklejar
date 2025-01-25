from django.test import TestCase

# Create your tests here.

# Create Hangout
"""
curl -X POST localhost:8000/create/ \
     -H "Content-Type: application/json" \
     -d '{"name": "Team Building Workshop", "deadline": "2025-02-01T18:00:00Z"}'

"""
