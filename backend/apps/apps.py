from django.apps import AppConfig
import threading
import time


class AppsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps'

    def ready(self):
        from django.utils.timezone import now  
        from .models import Hangout

        def update_hangout_status():
            while True:
                # Update status to 'voting' if the submission deadline has passed
                expired_hangouts_submission = Hangout.objects.filter(submission_deadline__lt=now(), status="idea collection")
                expired_hangouts_submission.update(status="voting")
                print(f"Updated {expired_hangouts_submission.count()} hangouts to 'voting'.")
                
                # Update status to 'completed' if the voting deadline has passed
                expired_hangouts_voting = Hangout.objects.filter(voting_deadline__lt=now(), status="voting")
                expired_hangouts_voting.update(status="completed")
                print(f"Updated {expired_hangouts_voting.count()} hangouts to 'completed'.")
                
                time.sleep(30) 

        thread = threading.Thread(target=update_hangout_status, daemon=True)
        thread.start()