from django.utils import timezone
from django.conf import settings
import json
import stripe
from api.payments.Stripe import Stripe

from api.core.utils import DotsValidationError
stripe.api_key = settings.STRIPE_SECRET_KEY
from datetime import datetime
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from users.models import Subscription,CustomPlan

User = get_user_model()

class Webhook(APIView):
    permission_classes = [AllowAny]

    def post(self,request,*args, **kwargs):
        webhook_secret = settings.STRIPE_WEBHOOK_KEY
        request_data = json.loads(request.body)

        if webhook_secret:
            signature = request.headers.get('stripe-signature')
            try:
                event = stripe.Webhook.construct_event(
                    payload=request.body, sig_header=signature, secret=webhook_secret)
                data = event['data']
            except Exception as e:
                return e
            event_type = event['type']
        else:
            data = request_data['data']
            event_type = request_data['type']

        data_object = data['object']
    
        if event_type == 'payment_intent.created':
            payment_intent = event['data']['object']        
            

        if event_type == 'invoice.payment_succeeded':
            if data_object['billing_reason'] in ['subscription_create', 'subscription_cycle']:
                subscription_id = data_object['subscription']
                payment_intent_id = data_object['payment_intent']            
                start_date = data_object['lines'].data[0]['period']['start']
                end_date = data_object['lines'].data[0]['period']['end']
                
                start_date = datetime.fromtimestamp(start_date)
                end_date = datetime.fromtimestamp(end_date)
                payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
                stripe.Subscription.modify(
                    subscription_id,
                    default_payment_method=payment_intent.payment_method
                )
                user = User.objects.get(stripe_id=data_object['customer'])
                old_payment_method_id = user.payment_method_id
                if old_payment_method_id:
                    Stripe.remove_payment_method(payment_method_id=old_payment_method_id)
                user.payment_method_id = payment_intent.payment_method
                user.has_subscribed = True
                user.save(update_fields=['payment_method_id','has_subscribed'])
                Subscription.objects.filter(user=user).exclude(stripe_subscription_id=subscription_id).delete()
                user_subscription = Subscription.objects.filter(stripe_subscription_id=subscription_id).first()
                if not user_subscription:
                    raise DotsValidationError({"subscription":f'Subscription not linked to any user {subscription_id}'})
                user_subscription.status = Subscription.Status.ACTIVE.value
                user_subscription.last_payment_date = timezone.make_aware(start_date)
                user_subscription.next_payment_date = timezone.make_aware(end_date)
                user_subscription.remaining_credits = user_subscription.plan.credits
                user_subscription.save(update_fields=['remaining_credits','last_payment_date','next_payment_date','status'])

                custom_plan = CustomPlan.objects.filter(user=user_subscription.user)
                if custom_plan.exists():
                    custom_plan.delete()

            elif event_type == 'invoice.payment_failed':
                raise DotsValidationError({'payment':('Invoice payment failed: %s', data_object.id)})

            elif event_type == 'invoice.finalized':
                raise DotsValidationError({'payment':('Invoice finalized: %s', data_object['id'])})

            elif event_type == 'customer.subscription.deleted':
                user_subscription = Subscription.objects.filter(stripe_subscription_id=data_object.id).first()
                if not user_subscription:
                    raise DotsValidationError({'payment':(f"Webhook Error: Subscription not linked to any user {data_object.id}")})
                else:
                    user_subscription.delete()
        return Response(status=status.HTTP_200_OK)
