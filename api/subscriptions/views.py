from datetime import datetime, timedelta
from api.core.mixin import CreateDotsModelMixin, GenericDotsViewSet,ListDotsModelMixin
from rest_framework.response import Response
from api.core.utils import DotsValidationError
from api.subscriptions.serializers import SubscriptionPlansSerializer,CreateSubscriptionSerializer,PaymentMethodSaveSerializer
from users.models import CustomPlan, SubscriptionPlans,Subscription
from api.payments.Stripe import Stripe
from api.subscriptions.models import Plans
from rest_framework.views import APIView
from rest_framework import status
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.conf import settings
from api.core.permissions import CanSubscribe
from rest_framework.permissions import AllowAny
import stripe


stripe.api_key = settings.STRIPE_SECRET_KEY






class SubscriptionPlanViewSet(GenericDotsViewSet,ListDotsModelMixin):
    serializer_class = SubscriptionPlansSerializer
    queryset = SubscriptionPlans.objects.all()
    permission_classes = [AllowAny]


    def get_queryset(self):
        data =  super().get_queryset()
        return data.order_by('id')




class CreateSubscriptionViewSet(GenericDotsViewSet,CreateDotsModelMixin):
    serializer_class = CreateSubscriptionSerializer
    permission_classes = [CanSubscribe]

    def create(self, request, *args, **kwargs):
        user = request.user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subscription = serializer.validated_data['subscription']
        frequency = serializer.validated_data['frequency']
        if not user.has_used_trial:
            today = datetime.today()
            end_date = today + timedelta(days=14)
            extra_fileds = {
                'plan': subscription,
                'remaining_credits': subscription.credits,
                'subscription_interval': frequency,
                'is_trial': True,
                'status':Subscription.Status.ACTIVE,
                'next_payment_date': end_date,
                'last_payment_date': today
            }
            Subscription.objects.create(user=user,**extra_fileds)
            user.has_used_trial = True
            user.save(update_fields=['has_used_trial'])
            return Response({"user":f"Your trial started for {subscription.name}-{frequency} till {end_date.date()} date."})
        else:
            if frequency == Plans.MONTHLY:
                price_id = subscription.price_id_monthly
            elif frequency == Plans.YEARLY:
                price_id = subscription.price_id_yearly       
            response = Stripe.create_subscription(customer_id=user.stripe_id,price_id=price_id)
            if response[0] == True:
                extra_fileds = {
                    'plan': subscription,
                    'remaining_credits': subscription.credits,
                    'stripe_subscription_id': response[1]['subscription_id'],
                    'latest_payment_client_secret': response[1]['client_secret'],
                    'subscription_interval': frequency,
                    'is_trial': False
                }
                custom_plan = CustomPlan.objects.filter(user=user)
                if custom_plan.exists():
                    custom_plan.delete()
                subscription = Subscription.objects.create(user=user, **extra_fileds)
            return Response(response)
    

from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication


class PaymentMethodView(APIView):
    authentication_classes = [SessionAuthentication,JWTAuthentication]
    permission_classes = [CanSubscribe]


    def post(self,request,*args, **kwargs):
        data = request.data
        serializer = PaymentMethodSaveSerializer(data=data,context={'user':request.user})
        serializer.is_valid(raise_exception=True)
        serializer.save_payment(data)
        return Response({"payment":"Payment method added."},status=status.HTTP_200_OK)
    
    def get(self,request,*args, **kwargs):
        user = request.user
        if not user.payment_method_id:
            raise DotsValidationError({"user":["You don't have any card."]})
        response = Stripe.retrieve_payment_method(method_id=user.payment_method_id)
        return Response({"data":[response[1]]},status=status.HTTP_200_OK)
    
class StripeIntent(APIView):
    permission_classes = [CanSubscribe]

    def get(self,request,*args, **kwargs):
        response = Stripe.stripe_intent(customer=request.user.stripe_id,type='card')
        if not response[0] == True:
            raise DotsValidationError({"client_secret":'Something went wrong.'})
        return Response({"client_secret":response[1]},status=status.HTTP_200_OK)
    

class UserInvoicesView(APIView):
    permission_classes = [CanSubscribe]

    def get(self,request,*args, **kwargs):
        customer = request.user.stripe_id
        response = Stripe.get_invoices(customer=customer)
        if response[0] == True:
            return Response({"invoices":response[1]},status=status.HTTP_200_OK)
        return DotsValidationError(response[0])













# Testing Functions



    
@login_required
def test(request):
    from django.middleware.csrf import get_token
    csrf_token = get_token(request)
    secret = request.GET.get('test_secret')
    return render(request,'test.html',{'secret':secret,'basic_auth':csrf_token})


@login_required
def change(request):
    from django.middleware.csrf import get_token
    csrf_token = get_token(request)
    secret = request.GET.get('test_secret')
    return render(request,'payment_intent.html',{'secret':secret,'basic_auth':csrf_token})


@login_required
def detached_cards(request):
    cards = stripe.Customer.list_payment_methods(request.user.stripe_id, type="card")
    for card in cards['data']:
        stripe.PaymentMethod.detach(card['id'])
    return Response(status=status.HTTP_200_OK)
