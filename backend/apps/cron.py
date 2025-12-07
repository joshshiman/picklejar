from django_cron import CronJobBase, Schedule
from django.utils.timezone import now
from .models import Hangout

class UpdateHangoutStatusCronJob(CronJobBase):
    RUN_EVERY_MINS = 5 

    schedule = Schedule(run_every_mins=RUN_EVERY_MINS)
    code = 'myapp.update_hangout_status'  

    def do(self):
        expired_hangouts = Hangout.objects.filter(deadline__lt=now(), status="idea collection")
        expired_hangouts.update(status="voting")
        print(f"Updated {expired_hangouts.count()} hangouts to 'voting'.")
