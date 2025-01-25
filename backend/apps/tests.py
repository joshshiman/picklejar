from django.test import TestCase

# Create your tests here.

# Create Hangout
"""
curl -i -X POST localhost:8000/create/ \
     -H "Content-Type: application/json" \
     -d '{"name": "Beach Volleyball", "deadline": "2025-02-01T18:00:00Z"}'

"""

# Get Hangout
"""
# curl -X GET localhost:8000/get_hangout/85a69bcf915f4235a23822e040951499
"""