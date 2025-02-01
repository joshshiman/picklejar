from django.urls import path
from apps.views import (create_hangout, submit_idea, submit_votes,
                       get_ideas_by_hangout)

urlpatterns = [
    path('create/', create_hangout),
    path('hangout/<uuid:hangout_id>/<uuid:participant_id>/submit_idea/', submit_idea),
    path('participant/<uuid:participant_id>/submit_votes/', submit_votes),
    path('hangout/<uuid:hangout_id>/ideas/', get_ideas_by_hangout),
]