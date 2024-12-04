from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from django.contrib.sessions.models import Session
from .models import Subscription, UserSession
from django.utils import timezone
from django.conf import settings


def my_scheduled_job():
    try:
        current_datetime = timezone.now()
        trial_subscriptions = Subscription.objects.filter(is_trial=True)
        for sub in trial_subscriptions:
            if sub.next_payment_date and current_datetime >= sub.next_payment_date:
                sub.delete()
    except Exception as e:
        print('Inside Job ', e)


def delete_stale_sessions():
    try:
        # session_lifetime = timedelta(hours=8)
        session_lifetime = settings.SESSION_LIFETIME
        stale_sessions = UserSession.objects.filter(last_activity__lt=timezone.now() - session_lifetime)
        for session in stale_sessions:
            try:
                Session.objects.filter(session_key=session.session_key).delete()
                session.delete()
            except Exception as e:
                print('Error in cleaning up session {}: {}'.format(session.session_key, e))
    except Exception as e:
        print(e)


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(my_scheduled_job, 'interval', seconds=60)
    scheduler.add_job(delete_stale_sessions, 'interval', seconds=60)
    scheduler.start()