from django.apps import AppConfig
import threading
import time

class AppsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps'

    def ready(self):
        from django.utils.timezone import now
        from .models import Hangout, Participant, Idea

        def status_updater():
            while True:
                # Check submission deadlines
                for hangout in Hangout.objects.filter(
                    submission_deadline__lt=now(),
                    status=HangoutStatus.IDEA_COLLECTION
                ):
                    hangout.status = HangoutStatus.VOTING
                    hangout.save()
                    for p in hangout.participant_set.all():
                        print(f"Email to {p.email}: Voting started! Link: /hangout/{hangout.id}/{p.id}")

                # Check voting deadlines
                for hangout in Hangout.objects.filter(
                    voting_deadline__lt=now(),
                    status=HangoutStatus.VOTING
                ):
                    hangout.status = HangoutStatus.COMPLETED
                    hangout.save()
                    winner = Idea.objects.filter(hangout=hangout).order_by('-vote_count').first()
                    for p in hangout.participant_set.all():
                        msg = winner.text if winner else "No winner"
                        print(f"Email to {p.email}: Winner is {msg}")

                time.sleep(120)

        threading.Thread(target=status_updater, daemon=True).start()