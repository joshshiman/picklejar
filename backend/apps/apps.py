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
                expired_hangouts = Hangout.objects.filter(deadline__lt=now(), status="idea collection")
                expired_hangouts.update(status="voting")
                print(f"Updated {expired_hangouts.count()} hangouts to 'voting'.")
                time.sleep(30)  

        thread = threading.Thread(target=update_hangout_status, daemon=True)
        thread.start()