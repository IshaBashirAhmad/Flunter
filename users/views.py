import json
import stripe
import operator
import stripe.error
import pandas as pd
from django.http import HttpResponse, JsonResponse
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.contrib.auth import get_user_model, login, logout
# from aisearchbot.models import CandidateProfiles, DuplicateProfiles
from flunter.helpers import forward_contact_us_email, queryDict_to_dict, send_report_candidate_email, send_verification_code_email, send_account_credentials_email, send_get_in_touch_email, forward_opt_out_request
from .models import OTP, CustomPlan, Subscription, SubscriptionPlans, TemporarySubscriptionData, User, UserProfile, Company, Contact, UserSession
from web.models import Searches, SharedUsers
from django.shortcuts import get_object_or_404, redirect
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
from django.template import loader
from django.db.models import Q
from functools import reduce
from django.contrib import messages
from administration.forms import ContactProfileForm
from .forms import CustomUserUpdateForm
from django.core import serializers
from django.utils import timezone


stripe.api_key = settings.STRIPE_SECRET_KEY


def get_subscription_plan(user, parent):
    context = {}
    context['is_custom_plan'] = False
    try:
        if user.role == User.Roles.AUTH_USER:
            auth_user_count = SharedUsers.objects.filter(belongs_to=SharedUsers.objects.get(user=user).belongs_to).count()
        elif user.role == User.Roles.CONTACT:
            auth_user_count = SharedUsers.objects.filter(belongs_to=Contact.objects.get(user=user).company.user).count()
        else:
            auth_user_count = SharedUsers.objects.filter(belongs_to=user).count()
        try:
            custom_plan = CustomPlan.objects.get(user=parent)
            sub = custom_plan
            context['is_custom_plan'] = True
        except Exception as e:
            print(e)
            sub = Subscription.objects.get(user=parent)
    except Exception as e:
        print(e)
        auth_user_count = 0
        sub = None
        
    context['auth_user_count'] = auth_user_count
    context['sub'] = sub
    return context


def get_parent_user(user):
    if user.role == User.Roles.AUTH_USER:
        parent = user.shared_user_profile.belongs_to
    elif user.role == User.Roles.CONTACT:
        parent = user.contact_profile.company.user
    else:
        parent = user
    return parent


def create_user_or_company(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            if User.objects.filter(email__iexact=data.get('email')).exists():
                return JsonResponse({'success': False, 'message': 'User already exists'}, status=409)
            if User.objects.filter(phone_number__iexact=data.get('phone_number')).exists():
                return JsonResponse({'success': False, 'message': 'User with this phone already exists'}, status=409)
            role = data.get('role')
            # username = (data.get('first_name') + data.get('last_name')).lower()
            if role == 'user':
                user = get_user_model().objects.create_user(
                    email=data.get('email'),
                    password=data.get('password'),
                    role='user',
                    first_name=data.get('first_name'),
                    last_name=data.get('last_name'),
                    phone_number=data.get('phone_number')
                )
                profile = UserProfile.objects.create(
                    user=user,
                    gender=data.get('gender'),
                    country=data.get('country'),
                    client_type=data.get('client_type')
                )
                return JsonResponse({'success': True, 'message': 'User created'}, status=201)
            elif role == 'company':
                user = get_user_model().objects.create_user(
                    email=data.get('email'),
                    password=data.get('password'),
                    role='company',
                    first_name=data.get('first_name'),
                    last_name=data.get('last_name'),
                    phone_number=data.get('phone_number')
                )
                company = Company.objects.create(
                    user=user,
                    company_name=data.get('company_name'),
                    company_siret_number=data.get('company_siret_number'),
                    company_address=data.get('company_address'),
                    designation=data.get('designation'),
                    client_type=data.get('client_type'),
                )
                return JsonResponse({'success': True, 'message': 'Company created'}, status=201)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    
    # If the request method is not POST or if there's an error, return error response
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


def user_login(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            try:
                user = User.objects.get(email__iexact=data.get('email'))
            except Exception as e:
                user = None
            if request.user_agent.is_mobile:
                return JsonResponse({'success': False, 'message': 'For now, our Web App is just for Desktop only. Please continue on Desktop to avail our services.'}, status=400)
            if user is None:
                return JsonResponse({'success': False, 'message': 'This email is not registered, signup first'}, status=404)
            elif not user.check_password(data.get('password')):
                return JsonResponse({'success': False, 'message': 'Password is incorrect'}, status=400)
            elif not user.is_active:
                return JsonResponse({'success': False, 'message': 'This account is suspended'}, status=401)
            elif user.is_staff or user.is_superuser:
                return JsonResponse({'success': False, 'message': 'You are not authorised person.'}, status=404)
            else:
                current_sessions = UserSession.objects.filter(user=user).count()
                print(current_sessions)
                parent = get_parent_user(user)
                user_subscription_plan = get_subscription_plan(user, parent)
                sub = user_subscription_plan['sub']
                is_custom_plan = user_subscription_plan['is_custom_plan']
                if sub is None:
                    max_sessions = 1
                elif is_custom_plan:
                    max_sessions = sub.simultaneous_connections_limit
                else:
                    max_sessions = sub.plan.simultaneous_connections_limit
                if current_sessions >= max_sessions:
                    return JsonResponse({'success': False, 'message': 'Maximum concurrent sessions reached.'}, status=403)
                login(request, user)
                UserSession.objects.create(user=user, session_key=request.session.session_key, last_activity=timezone.now())
                return JsonResponse({'success': True, 'message': 'User logged in'}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


def signout(request):
    session_key = request.session.session_key
    UserSession.objects.filter(session_key=session_key).delete()
    logout(request)
    return redirect('common_login')


def send_otp(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get('email')
            user = User.objects.filter(email=email).first()
            if user is None:
                return JsonResponse({'success': False, 'message': 'This email is not registered, signup first'}, status=404)
            else:
                token = send_verification_code_email(email)
                if token == False:
                    return JsonResponse({'success': False, 'message': 'Could not send email, retry later.'}, status=400)                    
                return JsonResponse({'success': True, 'message': 'OTP generated', 'token': token}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


def verify_otp(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            code = data.get('code')
            otp_record = OTP.objects.filter(verification_token=data.get('token')).first()
            if otp_record is None:
                return JsonResponse({'success': False, 'message': 'Verification code not found'}, status=404)
            elif otp_record.used == True:
                return JsonResponse({'success': False, 'message': 'Verification code already used'}, status=400)
            elif code != otp_record.code:
                return JsonResponse({'success': False, 'message': 'Verification code is invalid'}, status=400)
            else:
                otp_record.used = True
                otp_record.save(update_fields=['used'])
                return JsonResponse({'success': True, 'message': 'Verification code successfully verified', 'token': data.get('token')}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
        
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


def reset_password(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            otp_record = OTP.objects.filter(verification_token=data.get('token')).first()
            user = User.objects.filter(email=data.get('email')).first()
            password = data.get('password', None)
            confirm_password = data.get('confirm_password', None)
            if otp_record is None:
                return JsonResponse({'success': False, 'message': 'Verification code not found'}, status=404)
            elif otp_record.used == False:
                return JsonResponse({'success': False, 'message': 'Verification code not verified'}, status=400)
            elif password is None:
                return JsonResponse({'success': False, 'message': 'Password is required'}, status=400)
            elif confirm_password is None:
                return JsonResponse({'success': False, 'message': 'Confirm password is required'}, status=400)
            elif password != confirm_password:
                return JsonResponse({'success': False, 'message': 'Password and confirm password do not match'}, status=400)
            elif user is None:
                return JsonResponse({'success': False, 'message': 'User not found'}, status=404)
            else:
                user.set_password(password)
                user.save(update_fields=['password'])
                otp_record.delete()
                return JsonResponse({'success': True, 'message': 'Password updated successfully'}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)
    

def update_user(request, pk):
    if request.method == "POST":
        data = request.POST.copy()
        if 'profile_picture' in request.FILES:
            data['profile_picture'] = request.FILES['profile_picture']
        data = queryDict_to_dict(data)
        try:
            user_profile = get_object_or_404(UserProfile, pk=int(pk))
            user = user_profile.user

            if User.objects.filter(email__iexact=data.get('email')).exclude(id=user.id).exists():
                return JsonResponse({'success': False, 'message': 'User with this email already exists'}, status=400)
            if User.objects.filter(phone_number__iexact=data.get('phone_number')).exclude(id=user.id).exists():
                return JsonResponse({'success': False, 'message': 'User with this phone already exists'}, status=400)
            user.first_name = data.get('first_name')
            user.last_name = data.get('last_name')
            user.email = data.get('email', user.email)
            user.phone_number = data.get('phone_number', user.phone_number)
            if 'profile_picture' in data:
                user.profile_picture = data.get('profile_picture')
            user.save()

            user_profile.gender = data.get('gender', user_profile.gender)
            user_profile.country = data.get('country', user_profile.country)
            user_profile.client_type = data.get('individual_client_type', user_profile.client_type)
            user_profile.save()
            return JsonResponse({'success': True, 'message': 'User updated successfully'}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


def update_company(request, pk):
    if request.method == "POST":
        data = request.POST.copy()
        if 'profile_picture' in request.FILES:
            data['profile_picture'] = request.FILES['profile_picture']
        data = queryDict_to_dict(data)
        try:
            company_profile = get_object_or_404(Company, pk=int(pk))
            user = company_profile.user

            if User.objects.filter(email__iexact=data.get('email')).exclude(id=user.id).exists():
                return JsonResponse({'success': False, 'message': 'User with this email already exists'}, status=400)
            if User.objects.filter(phone_number__iexact=data.get('phone_number')).exclude(id=user.id).exists():
                return JsonResponse({'success': False, 'message': 'User with this phone already exists'}, status=400)

            user.first_name = data.get('first_name')
            user.last_name = data.get('last_name')
            user.email = data.get('email', user.email)
            user.phone_number = data.get('phone_number', user.phone_number)
            if 'profile_picture' in data:
                user.profile_picture = data.get('profile_picture')
            user.save()

            company_profile.company_name = data.get('company_name', company_profile.company_name)
            company_profile.company_siret_number = data.get('company_siret_number', company_profile.company_siret_number)
            company_profile.company_address = data.get('company_name', company_profile.company_address)
            company_profile.designation = data.get('designation', company_profile.designation)
            company_profile.client_type = data.get('client_type', company_profile.client_type)
            company_profile.save()
            return JsonResponse({'success': True, 'message': 'User updated successfully'}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


def update_password(request, pk):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            current_password = data.get('current_password')
            new_password = data.get('new_password')
            confirm_password = data.get('confirm_password')
            try:
                user = User.objects.get(id=int(pk))
            except Exception as e:
                user = None
            if user is None:
                return JsonResponse({'success': False, 'message': 'User is not registered, signup first'}, status=404)
            elif not user.check_password(current_password):
                return JsonResponse({'success': False, 'message': 'Current Password is incorrect'}, status=400)
            elif len(new_password) < 8:
                return JsonResponse({'success': False, 'message': 'New Password must be atleast 8 characters'}, status=400)
            elif new_password != confirm_password:
                return JsonResponse({'success': False, 'message': 'New Password and Confirm Password do not match'}, status=400)
            else:
                user.set_password(new_password)
                user.save(update_fields=['password'])
                # update_session_auth_hash(request, request.user)
                return JsonResponse({'success': True, 'message': 'Password updated successfully'}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


def create_authorised_user(request):
    if request.method == "POST":
        data = request.POST.copy()
        if 'profile_picture' in request.FILES:
            data['profile_picture'] = request.FILES['profile_picture']
        data = queryDict_to_dict(data)
        try:
            if User.objects.filter(email__iexact=data.get('email')).exists():
                return JsonResponse({'success': False, 'message': 'User already exists'}, status=409)
            parent = get_parent_user(request.user)
            user_subscription_plan = get_subscription_plan(request.user, parent)
            sub = user_subscription_plan['sub']

            if user_subscription_plan['is_custom_plan']:
                user_plan_limit = sub.users_limit
            else:
                user_plan_limit = sub.plan.users_limit
            
            actual_auth_users = SharedUsers.objects.filter(belongs_to = request.user).count()
            if user_plan_limit is None or actual_auth_users < user_plan_limit:
                user = get_user_model().objects.create_user(
                    email=data.get('email'),
                    password=data.get('password1'),
                    first_name=data.get('first_name'),
                    last_name=data.get('last_name'),
                    role='auth_user',
                )
                if 'profile_picture' in data and data.get('profile_picture') != '':
                    user.profile_picture = data.get('profile_picture')
                    user.save(update_fields=['profile_picture'])
                profile = SharedUsers.objects.create(
                    user=user,
                    belongs_to = request.user
                )
                email = data.get('email')
                password = data.get('password1')
                url=f'{settings.FRONTEND_URL}/login/'
                send_account_credentials_email(email, password, url)
                
                user = User.objects.get(email=user)
                user_json = serializers.serialize('json', [user])
                user_data = json.loads(user_json)[0]['fields'] 
                
                user_data['profile_picture'] = user.profile_picture.url
                user_data['id'] = user.id
                
                return JsonResponse({'success': True, 'message': 'User created', 'user': user_data}, status=201)
            return JsonResponse({'success': False, 'message': 'Plan user limit reached.'}, status=400)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


def update_authorised_user(request, pk):
    if request.method == "POST":
        data = request.POST.copy()
        if 'profile_picture' in request.FILES:
            data['profile_picture'] = request.FILES['profile_picture']
        data = queryDict_to_dict(data)
        try:
            try:
                auth_user = User.objects.get(id=int(pk))
            except Exception as e:
                auth_user = None
            if auth_user is None:
                return JsonResponse({'success': False, 'message': 'User not found'}, status=404)
            if User.objects.filter(email__iexact=data.get('email')).exclude(id=int(pk)).exists():
                return JsonResponse({'success': False, 'message': 'This email is already registered.'}, status=409)
            
            auth_user.first_name = data.get('first_name')
            auth_user.last_name = data.get('last_name')
            auth_user.email = data.get('email')
            auth_user.profile_picture = data.get('profile_picture')
            
            if 'profile_picture' in data and data.get('profile_picture') != '':
                auth_user.profile_picture = data.get('profile_picture')
                auth_user.save(update_fields=['first_name', 'last_name', 'email', 'profile_picture'])
            else:
                auth_user.save(update_fields=['first_name', 'last_name', 'email'])
            return JsonResponse({'success': True, 'message': 'User updated'}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


def delete_authorised_user(request, pk):
    if request.method == 'DELETE':
        try:
            try:
                auth_user = User.objects.get(id=int(pk))
            except Exception as e:
                auth_user = None
            if auth_user is None:
                return JsonResponse({'success': False, 'message': 'User not found'}, status=404)
            if auth_user.shared_user_profile.belongs_to != request.user:
                return JsonResponse({'success': False, 'message': 'You do not have permission to delete'}, status=400)
            User.objects.filter(id = auth_user.id).delete()
            return JsonResponse({'success': True, 'message': 'User deleted'}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)

@csrf_exempt
def update_credits(request):
    context = {}
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            parent = get_parent_user(request.user)
            user_subscription_plan = get_subscription_plan(request.user, parent)

            if user_subscription_plan['is_custom_plan']:
                current_subscription = CustomPlan.objects.get(user=parent)
            else:
                current_subscription = Subscription.objects.get(user=parent)
            
            # current_subscription = Subscription.objects.get(user = current_user)
            total_credits = current_subscription.remaining_credits
            
            #credits rates
            pro_email = 1
            personal_email = 3
            landline_phone = 1
            cell_phone = 10
            
            if data['key'] == 'pro-email':
                if total_credits < pro_email:
                    return JsonResponse({'success': False, 'message': 'Not enough credits to perform this action.', 'remaining_credits': total_credits}, status=400)
                remaining_credits = total_credits - pro_email
                current_subscription.remaining_credits = remaining_credits
                current_subscription.save(update_fields=['remaining_credits'])
                
            elif data['key'] == 'personal-email':
                if total_credits < personal_email:
                    return JsonResponse({'success': False, 'message': 'Not enough credits to perform this action.', 'remaining_credits': total_credits}, status=400)
                remaining_credits = total_credits - personal_email
                current_subscription.remaining_credits = remaining_credits
                current_subscription.save(update_fields=['remaining_credits'])
                
            elif data['key'] == 'landing-phone':
                if total_credits < landline_phone:
                    return JsonResponse({'success': False, 'message': 'Not enough credits to perform this action.', 'remaining_credits': total_credits}, status=400)
                remaining_credits = total_credits - landline_phone
                current_subscription.remaining_credits = remaining_credits
                current_subscription.save(update_fields=['remaining_credits'])
                
            elif data['key'] == 'cell-phone':
                if total_credits < cell_phone:
                    return JsonResponse({'success': False, 'message': 'Not enough credits to perform this action.', 'remaining_credits': total_credits}, status=400)
                remaining_credits = total_credits - cell_phone
                current_subscription.remaining_credits = remaining_credits
                current_subscription.save(update_fields=['remaining_credits'])
                
            context['success'] =True
            context['message'] = 'credits updated.'
            context['remaining_credits'] = remaining_credits
        except Exception as e:
            print(e)
    else:
        context['success'] = False
        context['message'] = 'Bad request.'
    return JsonResponse(context)

def config(request):
    context = {}
    context['stripe_publishable_key'] = settings.STRIPE_PUBLIC_KEY
    return JsonResponse(context, status=200)


def create_payment_intent(request):
    try:
        data = request.json
        payment_method_type = data['paymentMethodType']
        currency = data['currency']
        
        payment_intent = stripe.PaymentIntent.create(
            amount = 1999,
            currency = currency,
            payment_method_types =[payment_method_type] 
        )
    except stripe.error.StripeError as e:
        return JsonResponse({'error': {'message': e.user_message}}), 400
    except Exception as e:
        return JsonResponse({'error': {'message': e.user_message}}),500
    
    return JsonResponse({'clientSecret': payment_intent.clien_secret})


@csrf_exempt
def initiate_subscription(request, pk):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            interval = data.get('interval', 'm')
            plan = SubscriptionPlans.objects.get(id=int(pk))
            today = datetime.now()
            if interval == 'y':
                price_id = plan.price_id_yearly
                sub_interval = Subscription.Interval.YEARLY
                next_payment_date = today + timedelta(days=365)
            else:
                price_id = plan.price_id_monthly
                sub_interval = Subscription.Interval.MONTHLY
                next_payment_date = today + timedelta(days=30)
            
            if Subscription.objects.filter(user=request.user).exists():
                try:
                    stripe.Subscription.cancel(request.user.subscription.stripe_subscription_id)
                except Exception as e:
                    print(e)
                
            subscription = stripe.Subscription.create(
                customer=request.user.stripe_id,
                items=[{
                    'price': price_id,
                }],
                payment_behavior='default_incomplete',
                expand=['latest_invoice.payment_intent'],
            )
            data = dict(
                subscription_id=subscription.id, 
                client_secret=subscription.latest_invoice.payment_intent.client_secret,
                subscription=subscription
            )
            update_fields = {'plan': plan, 'remaining_credits': plan.credits, 'stripe_subscription_id': subscription.id, 'latest_payment_client_secret': subscription.latest_invoice.payment_intent.client_secret, 'subscription_interval': sub_interval, 'is_trial': False}
            if settings.ENV == 'dev':
                custom_plan = CustomPlan.objects.filter(user=request.user)
                if custom_plan.exists():
                    custom_plan.delete()
                subscription = Subscription.objects.update_or_create(user=request.user, defaults=update_fields)
            else:
                subscription = TemporarySubscriptionData.objects.update_or_create(user=request.user, defaults=update_fields)
            return JsonResponse({'success': True, 'message': 'Payment initiated', 'data': data}, status=200)
        
            # if plan.monthly_price == 0 and plan.yearly_price == 0:
            #     if request.user.subscription.stripe_subscription_id:
            #         stripe.Subscription.cancel(request.user.subscription.stripe_subscription_id)
            #     update_fields = {'plan': plan, 'stripe_subscription_id': '', 'latest_payment_client_secret': '', 'status': Subscription.Status.ACTIVE, 'subscription_interval': Subscription.Interval.MONTHLY, 'last_payment_date': today, 'next_payment_date': None}
            #     subscription = Subscription.objects.update_or_create(user=request.user, defaults=update_fields)
            #     return JsonResponse({'success': True, 'message': 'Payment initiated'}, status=200)
            # else:
            #     if request.user.subscription.stripe_subscription_id:
            #         try:
            #             stripe.Subscription.cancel(request.user.subscription.stripe_subscription_id)
            #         except Exception as e:
            #             print(e)
                    
            #     subscription = stripe.Subscription.create(
            #         customer=request.user.stripe_id,
            #         items=[{
            #             'price': price_id,
            #         }],
            #         payment_behavior='default_incomplete',
            #         expand=['latest_invoice.payment_intent'],
            #     )
            #     data = dict(
            #         subscription_id=subscription.id, 
            #         client_secret=subscription.latest_invoice.payment_intent.client_secret,
            #         subscription=subscription
            #     )
            #     update_fields = {'plan': plan, 'stripe_subscription_id': subscription.id, 'latest_payment_client_secret': subscription.latest_invoice.payment_intent.client_secret, 'subscription_interval': sub_interval}
            #     subscription = Subscription.objects.update_or_create(user=request.user, defaults=update_fields)
            #     return JsonResponse({'success': True, 'message': 'Payment initiated', 'data': data}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


@csrf_exempt
def webhook(request):
    # You can use webhooks to receive information about asynchronous payment events.
    # For more about our webhook events check out https://stripe.com/docs/webhooks.
    webhook_secret = settings.STRIPE_WEBHOOK_KEY
    request_data = json.loads(request.body)

    if webhook_secret:
        # Retrieve the event by verifying the signature using the raw body and secret if webhook signing is configured.
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
        # print('paymentIntent created!!', event.id, payment_intent.id, payment_intent.status)
        
        

    if event_type == 'invoice.payment_succeeded':
        # print("Payment succeeded!!", data)
        if data_object['billing_reason'] in ['subscription_create', 'subscription_cycle']:
            # The subscription automatically activates after successful payment
            # Set the payment method used to pay the first invoice
            # as the default payment method for that subscription
            subscription_id = data_object['subscription']
            payment_intent_id = data_object['payment_intent']
            # print('start : ',data_object['lines'].data[0]['period']['start'], 'end : ',data_object['lines'].data[0]['period']['end'])
            
            start_date = data_object['lines'].data[0]['period']['start']
            end_date = data_object['lines'].data[0]['period']['end']
            
            start_date = datetime.fromtimestamp(start_date)
            end_date = datetime.fromtimestamp(end_date)
            # print(start_date, end_date)
            
            # Retrieve the payment intent used to pay the subscription
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            # Set the default payment method
            stripe.Subscription.modify(
                subscription_id,
                default_payment_method=payment_intent.payment_method
            )

            # print("Default payment method set for subscription:" + payment_intent.payment_method)
            
            # NOTE: activate subscription

            if settings.ENV == 'dev':
                user_subscription = Subscription.objects.filter(stripe_subscription_id=subscription_id).first()
            else:
                user_subscription = TemporarySubscriptionData.objects.filter(stripe_subscription_id=subscription_id).first()

            if not user_subscription:
                print(f"Webhook Error: Subscription not linked to any user {subscription_id}")
            else:
                if settings.ENV == 'dev':    
                    user_subscription.activate_subscription()
                    # update_fields = {'last_payment_date': start_date, 'next_payment_date': end_date}
                    user_subscription.last_payment_date = start_date
                    user_subscription.next_payment_date = end_date
                    user_subscription.remaining_credits = user_subscription.plan.credits
                    user_subscription.save(update_fields=['remaining_credits','last_payment_date','next_payment_date'])

                    custom_plan = CustomPlan.objects.filter(user=user_subscription.user)
                    if custom_plan.exists():
                        custom_plan.delete()
                else:
                    custom_plan = CustomPlan.objects.filter(user=user_subscription.user)
                    if custom_plan.exists():
                        custom_plan.delete()
                    defaults = {
                        'plan': user_subscription.plan,
                        'stripe_subscription_id': user_subscription.stripe_subscription_id,
                        'latest_payment_client_secret': user_subscription.latest_payment_client_secret,
                        # 'user_payment_method_id': user_subscription.user_payment_method_id,
                        'last_payment_date': start_date,
                        'next_payment_date': end_date,
                        'status': Subscription.Status.ACTIVE,
                        'subscription_interval': user_subscription.subscription_interval,
                        'remaining_credits': user_subscription.remaining_credits,
                        'is_trial': False
                    }
                    
                    subscription= Subscription.objects.update_or_create(user=user_subscription.user, defaults=defaults)
                    # subscription = Subscription(
                    #     user=user_subscription.user,
                    #     plan=user_subscription.plan,
                    #     stripe_subscription_id=user_subscription.stripe_subscription_id,
                    #     latest_payment_client_secret=user_subscription.latest_payment_client_secret,
                    #     user_payment_method_id=user_subscription.user_payment_method_id,
                    #     last_payment_date=user_subscription.last_payment_date,
                    #     next_payment_date=user_subscription.next_payment_date,
                    #     status=user_subscription.status,
                    #     subscription_interval=user_subscription.subscription_interval,
                    #     remaining_credits=user_subscription.remaining_credits
                    # )
                    # subscription.save()
                # subscription = Subscription.objects.update_or_create(user=request.user, defaults=update_fields)

        elif event_type == 'invoice.payment_failed':
            # If the payment fails or the customer does not have a valid payment method,
            # an invoice.payment_failed event is sent, the subscription becomes past_due.
            # Use this webhook to notify your user that their payment has
            # failed and to retrieve new card details.
            # print(data)
            print('Invoice payment failed: %s', data_object.id)

        elif event_type == 'invoice.finalized':
            # If you want to manually send out invoices to your customers
            # or store them locally to reference to avoid hitting Stripe rate limits.
            # print(data)
            print('Invoice finalized: %s', data_object['id'])

        elif event_type == 'customer.subscription.deleted':
            # handle subscription cancelled automatically based
            # upon your subscription settings. Or if the user cancels it.
            # print(data)
            print('Subscription canceled: %s', data_object.id)
            # NOTE: remove subscription and add default free one
            user_subscription = Subscription.objects.filter(stripe_subscription_id=data_object.id).first()
            if not user_subscription:
                print(f"Webhook Error: Subscription not linked to any user {data_object.id}")
            else:
                user_subscription.delete()

    return JsonResponse({'status': 200})


def create_search_record(request):
    context = {}
    if request.method == 'POST':
        
        try:
            data = json.loads(request.body)
            
            keywords = data.get('keywords', '')
            location = ','.join(data.get('location', [])) if isinstance(data.get('location'), list) else ''
            job_title = ','.join(data.get('jobs_title_list', [])) if isinstance(data.get('jobs_title_list'), list) else ''
            skills = ','.join(data.get('skills_list', [])) if isinstance(data.get('skills_list'), list) else ''
            companies = ','.join(data.get('company_name_list', [])) if isinstance(data.get('company_name_list'), list) else '' 
            head_count = ','.join(data.get('headcount_ranges', [])) if isinstance(data.get('headcount_ranges'), list) else ''
            search_via = data.get('search_via', '')
            contact_name = data.get('contact_name', '')
            record_count = data.get('record_count', 0)
            search_via_op = data.get('contact_details_radio', 'or')
            seniority_levels = ', '.join(data.get('seniority_levels', [])).replace(' ', '') if isinstance(data.get('seniority_levels'), list) else ''

            search_record = Searches.objects.create(
                user=request.user, keywords=keywords, location=location, job_title=job_title,
                search_via=search_via, skills=skills, companies=companies, number_of_results=record_count, 
                search_via_op=search_via_op, contact_name=contact_name, head_count=head_count,
                search_type=Searches.Types.Recent, seniority_levels=seniority_levels
            )
            context['search_id'] = search_record.id
            context['message'] = 'Search query saved as recent search.'
            
            context['success'] = True
            return JsonResponse(context, status=200)

        except Exception as e:
            print(e)
            context['success'] = False
            context['message'] = 'Something bad happened!'
            return JsonResponse(context, status=500)

    return JsonResponse(context)


def save_search(request):
    context = {}
    if request.method == 'POST':
        try:
            search_id = request.POST.get('search_id', None)
            if search_id is not None:
                search_record = Searches.objects.get(id=int(search_id))
                search_record.search_type = Searches.Types.Saved
                search_record.save(update_fields=['search_type'])
                # search_record = Searches.objects.create(user= request.user, keywords = keywords, location = location, search_via = key_with_on_value, search_type = Searches.Types.Saved)
            # search_record.save()
            context['success'] = True
            context['message'] = 'Search query saved!'
            return JsonResponse(context, status=200)

        except Exception as e:
            print(e)
            context['success'] = False
            context['message'] = 'Something bad happed!'
            return JsonResponse(context, status=500)
        
    context['success'] = False
    context['message'] = 'Invalid request'
    return JsonResponse(context, status=400)


@csrf_exempt
def delete_search(request, pk):
    if request.method == 'POST':        
        search_record = Searches.objects.get(id = pk)
        if search_record is not None:
            search_record.is_deleted = True
            search_record.save(update_fields=['is_deleted'])
            messages.success(request, 'Your search record were successfully deleted!')
            context = {'success': True, 'message': 'record deleted.'}
            return JsonResponse(context)
        else:
            messages.error(request, 'Search record not found.')
            context = {'success': False, 'message': 'record not found.'}
            return JsonResponse(context)
        

@csrf_exempt
def del_search(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            search_id = data.get('id')
            search_record = Searches.objects.get(id=int(search_id))
            if search_record is None:
                return JsonResponse({'success': True, 'message': 'Record not found'}, status=404)
            elif search_record.user != request.user:
                return JsonResponse({'success': True, 'message': 'You are not allowed to perform this operation'}, status=400)
            else:
                search_record.is_deleted = True
                search_record.save(update_fields=['is_deleted'])
                return JsonResponse({'success': True, 'message': 'Search deleted'}, status=204)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


@csrf_exempt
def get_recent_searches(request, params):
    context = {}
    context['msg'] = None
    context['success'] = False
    try:
        params_list = params.split('&')
        params_dict = {}
        for param in params_list:
            key, value = param.split('=')
            params_dict[key] = value
        page_number = params_dict.get("page", None)
        search_params = params_dict.get("q", '')

        recent_searches = Searches.objects.filter(user=request.user, is_deleted=False).order_by('-id')
        paginator = Paginator(recent_searches, 10)
        page_obj = paginator.get_page(page_number)
        context['current_page'] = page_obj.number
        context['total_pages'] = paginator.num_pages
        text_template = loader.get_template('ajax/recent-search-table.html')
        html = text_template.render({'page_obj':page_obj, 'search_params': search_params, 'current_page': context['current_page'], 'total_pages': context['total_pages']})
        context['html'] = html
        context['msg'] = 'Successfully retrieved recent searches'
        context['success'] = True
    except Exception as e:
        print(e)
    return JsonResponse(context)


@csrf_exempt
def get_saved_searches(request, params):
    context = {}
    context['msg'] = None
    context['success'] = False
    try:
        params_list = params.split('&')
        params_dict = {}
        for param in params_list:
            key, value = param.split('=')
            params_dict[key] = value
        page_number = params_dict.get("page", None)
        search_params = params_dict.get("q", '')
        
        fields_to_search = ['keywords', 'location', 'search_via']
        q_objects = [Q(**{f"{field}__icontains": search_params}) for field in fields_to_search]
        combined_filter = reduce(operator.or_, q_objects)

        saved_searches = Searches.objects.filter(user=request.user, search_type=Searches.Types.Saved, is_deleted=False).order_by('-id')
        saved_searches = saved_searches.filter(combined_filter)
        paginator = Paginator(saved_searches, 20)
        page_obj = paginator.get_page(page_number)
        context['current_page'] = page_obj.number
        context['total_pages'] = paginator.num_pages
        text_template = loader.get_template('ajax/saved-search-table.html')
        html = text_template.render({'page_obj':page_obj, 'search_params': search_params, 'current_page': context['current_page'], 'total_pages': context['total_pages']})
        context['html'] = html
        context['msg'] = 'Successfully retrieved saved searches'
        context['success'] = True
    except Exception as e:
        print(e)
    return JsonResponse(context)


@csrf_exempt
def get_contact_list(request, params):
    context = {}
    context['msg'] = None
    context['success'] = False
    try:
        params_list = params.split('&')
        params_dict = {}
        for param in params_list:
            key, value = param.split('=')
            params_dict[key] = value
        page_number = params_dict.get("page", None)
        search_params = params_dict.get("q", '')

        contacts = User.objects.filter(role=User.Roles.CONTACT).order_by('-id')
        paginator = Paginator(contacts, 12)
        page_obj = paginator.get_page(page_number)
        context['current_page'] = page_obj.number
        context['total_pages'] = paginator.num_pages
        text_template = loader.get_template('ajax/contact-table.html')
        html = text_template.render({'page_obj':page_obj, 'search_params': search_params, 'current_page': context['current_page'], 'total_pages': context['total_pages']})
        context['html'] = html
        context['msg'] = 'Successfully retrieved contact list'
        context['success'] = True
    except Exception as e:
        print(e)
    return JsonResponse(context)


def send_contact_email(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            token = send_get_in_touch_email(data)
            if token == False:
                return JsonResponse({'success': False, 'message': 'Could not send email, retry later.'}, status=400)                    
            return JsonResponse({'success': True, 'message': 'Email sent', 'token': token}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


def send_contact_us_email(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            token = forward_contact_us_email(data)
            if token == False:
                return JsonResponse({'success': False, 'message': 'Could not send email, retry later.'}, status=400)                    
            return JsonResponse({'success': True, 'message': 'Email sent'}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)

def send_opt_out_request(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            token = forward_opt_out_request(data)
            if token == False:
                return JsonResponse({'success': False, 'message': 'Could not send email, retry later.'}, status=400)                    
            return JsonResponse({'success': True, 'message': 'Email sent'}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)    

def update_contact(request, pk):
    context = {}
    context['active_sidebar'] = 'contacts'
    try:
        contact_instance = User.objects.get(id = pk)
        user_profile_instance = Contact.objects.get(user = contact_instance)
        user_form = CustomUserUpdateForm(instance=contact_instance)
        user_profile_form = ContactProfileForm(instance = user_profile_instance, update=True)
        if request.method == 'POST':    
            user_form = CustomUserUpdateForm(request.POST, request.FILES, instance=contact_instance)
            user_profile_form = ContactProfileForm(request.POST, instance=user_profile_instance, update=True)
            if user_form.is_valid() and user_profile_form.is_valid():
                user = user_form.save()
                profile = user_profile_form.save(commit=False)
                profile.user = user
                profile.save()
                messages.success(request, 'Contact details successfully updated.')
                context['success'] = True
                context['message'] = 'Contact details successfully updated.'
                return JsonResponse(context,status=200)
            else:
                context['success'] = False                
                combined_errors = {}
                combined_errors.update({field: errors for field, errors in user_form.errors.items()})
                combined_errors.update({field: errors for field, errors in user_profile_form.errors.items()})
                formatted_errors = "\n".join([f"{field}: {', '.join(errors)}" for field, errors in combined_errors.items()])
                context['message'] = formatted_errors
                return JsonResponse(context,status=400)
        else:
            context['success'] = False
            context['message'] = 'Invalid request'
            return JsonResponse(context,status=400)
    except Exception as e:
        print(e)
        context['success'] = False
        context['message'] = 'Something bad happened'
    # context['user_form'] = user_form
    # context['user_profile_form'] = user_profile_form    
    return JsonResponse(context, status=500)


def add_custom_plan(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            try:
                company = Company.objects.get(id=int(data.get('company')))
            except Exception as e:
                print(e)
                company = None
            if company is None:
                return JsonResponse({'success': False, 'message': 'The selected company does not exists.'}, status=404)
            elif CustomPlan.objects.filter(user=company.user).exists():
                return JsonResponse({'success': False, 'message': 'The selected company already has a custom plan.'}, status=400)
            
            prev_sub = Subscription.objects.filter(user=company.user)
            if prev_sub.exists():
                try:
                    stripe.Subscription.cancel(company.user.subscription.stripe_subscription_id)
                    prev_sub.delete()
                except Exception as e:
                    print(e)

            start_datetime = datetime.now()
            end_datetime = start_datetime + timedelta(days=30)

            company_user = User.objects.get(id=company.user.id)
            company_user.has_used_trial = True
            company_user.save(update_fields=['has_used_trial'])

            company_custom_plan = CustomPlan.objects.create(
                user=company_user,
                monthly_price=data.get('monthly_price'),
                # searches_per_month=data.get('searches_per_month'),
                # saved_searches_limit=data.get('saved_searches_limit'),
                users_limit=data.get('users_limit'),
                credits=data.get('credits'),
                remaining_credits=data.get('credits'),
                simultaneous_connections_limit = data.get('simultaneous_connections_limit'),
                last_payment_date=start_datetime,
                next_payment_date=end_datetime
            )
            return JsonResponse({'success': True, 'message': 'Custom plan created'}, status=201)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


def update_custom_plan(request, pk):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            try:
                company = CustomPlan.objects.get(id=int(pk))
            except Exception as e:
                print(e)
                company = None
            if company is None:
                return JsonResponse({'success': False, 'message': 'The selected company does not exists.'}, status=404)
            company.monthly_price = data.get('monthly_price')
            # company.saved_searches_limit = data.get('saved_searches_limit')
            # company.searches_per_month = data.get('searches_per_month')
            company.users_limit = data.get('users_limit')
            company.simultaneous_connections_limit =data.get("simultaneous_connections_limit")
            updated_fields = ['monthly_price', 'users_limit', 'credits', 'simultaneous_connections_limit']

            if int(data.get('credits')) > company.credits:
                difference = int(data.get('credits')) - company.credits
                company.remaining_credits = company.remaining_credits + difference
                updated_fields.append('remaining_credits')
            elif int(data.get('credits')) < company.credits:
                difference = company.credits - int(data.get('credits'))
                company.remaining_credits = company.remaining_credits - difference
                updated_fields.append('remaining_credits')
            
            company.credits = data.get('credits')
            company.save(update_fields=updated_fields)
            return JsonResponse({'success': True, 'message': 'Custom plan updated'}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


@csrf_exempt
def get_custom_plan_list(request, params):
    context = {}
    context['msg'] = None
    context['success'] = False
    try:
        params_list = params.split('&')
        params_dict = {}
        for param in params_list:
            key, value = param.split('=')
            params_dict[key] = value
        page_number = params_dict.get("page", None)
        search_params = params_dict.get("q", '')

        contacts = CustomPlan.objects.all().order_by('-id')
        paginator = Paginator(contacts, 12)
        page_obj = paginator.get_page(page_number)
        context['current_page'] = page_obj.number
        context['total_pages'] = paginator.num_pages
        text_template = loader.get_template('ajax/custom-plan-table.html')
        html = text_template.render({'page_obj':page_obj, 'search_params': search_params, 'current_page': context['current_page'], 'total_pages': context['total_pages']})
        context['html'] = html
        context['msg'] = 'Successfully retrieved custom plan list'
        context['success'] = True
    except Exception as e:
        print(e)
    return JsonResponse(context)


def delete_custom_plan(request, pk):
    if request.method == 'DELETE':
        try:
            try:
                custom_plan = CustomPlan.objects.get(id=int(pk))
            except Exception as e:
                custom_plan = None
                print(e)
            if custom_plan is None:
                return JsonResponse({'success': False, 'message': 'Custom plan not found'}, status=404)
            custom_plan.delete()
            return JsonResponse({'success': True, 'message': 'Custom plan deleted'}, status=204)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


def save_user_payment_id(request, payment_method_id):
    if payment_method_id:
        try:
            user = request.user
            user = User.objects.get(id=user.id)
            user.payment_method_id = payment_method_id
            user.save(update_fields=['payment_method_id'])
            
            customer = user.stripe_id
            stripe.PaymentMethod.attach(
                payment_method_id,
                customer=customer,
            )

            response = stripe.Customer.modify(
                customer,
                invoice_settings={
                    'default_payment_method': payment_method_id,
                },
            )
            return JsonResponse({'success': True, 'message': 'Payment method saved'}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


@csrf_exempt
def save_payment_method(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            payment_method_id = data.get('payment_method_id')
            if not payment_method_id:
                return JsonResponse({'success': False, 'message': 'Payment method ID is required'}, status=400)
            
            # response = save_user_payment_id(request, payment_method_id)
            return save_user_payment_id(request, payment_method_id)
            # if response['success']:
            #     return JsonResponse({'success': True, 'message': 'Payment method saved'}, status=200)
            # else:
            #     return JsonResponse({'success': False, 'message': 'Failed to save payment method'}, status=500)
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    return JsonResponse({'success': False, 'message': 'Invalid request method'}, status=405)

@csrf_exempt
def start_trial(request, pk):
    if request.method == 'POST':
        try:            
            try:
                sub = Subscription.objects.get(user=request.user)
            except Exception as e:
                print(e)
                sub = None

            custom_plan = CustomPlan.objects.filter(user=request.user)
            if request.user.has_used_trial == True:
                return JsonResponse({'success': False, 'message': 'Free trial already used'}, status=400)
            elif sub is not None and sub.is_trial == False:
                return JsonResponse({'success': False, 'message': 'User already has subscribed a plan'}, status=400)
            elif custom_plan.exists():
                return JsonResponse({'success': False, 'message': 'User already has a custom plan'}, status=400)
            else:
                data = json.loads(request.body)
                interval = data.get('interval', 'm')
                plan = SubscriptionPlans.objects.get(id=int(pk))
                today = datetime.now()
                today = timezone.make_aware(today)
                if interval == 'y':
                    sub_interval = Subscription.Interval.YEARLY
                else:
                    sub_interval = Subscription.Interval.MONTHLY
                if settings.ENV == 'dev':
                    next_payment_date = today + timedelta(minutes=5)
                else:
                    next_payment_date = today + timedelta(days=14)
                update_fields = {'plan': plan, 'remaining_credits': plan.credits, 'subscription_interval': sub_interval, 'is_trial': True, 'next_payment_date': next_payment_date, 'last_payment_date': today}
                subscription = Subscription.objects.update_or_create(user=request.user, defaults=update_fields)
                user = User.objects.get(id=request.user.id)
                user.has_used_trial = True
                user.save(update_fields=['has_used_trial'])
            return JsonResponse({'success': True, 'message': 'Trial started'}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


@csrf_exempt
def create_setup_intent(request):
    if request.method == 'POST':
        # Retrieve the customer from your database
        customer = request.user.stripe_id

        # Create a SetupIntent
        setup_intent = stripe.SetupIntent.create(
            customer=customer,
            payment_method_types =['card'],
        )

        return JsonResponse({
            'client_secret': setup_intent.client_secret
        })
    return JsonResponse({'error': 'Invalid request method'}, status=400)


@csrf_exempt
def update_card(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        payment_method_id = data.get('payment_method_id')
        card_holder_name = data.get('name')

        # Retrieve the customer from your database
        customer = request.user.stripe_id

        # Attach the payment method to the customer
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer,
        )

        # Update the default payment method
        response = stripe.Customer.modify(
            customer,
            invoice_settings={
                'default_payment_method': payment_method_id,
            },
            name = card_holder_name,
        )
        
        payment_method_id = response['invoice_settings']['default_payment_method']
        save_user_payment_id(request, payment_method_id)
        
        return JsonResponse({'success': True})
    return JsonResponse({'error': 'Invalid request method'}, status=400)


def report_candidate_email(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            token = send_report_candidate_email(data)
            if token == False:
                return JsonResponse({'success': False, 'message': 'Could not send email, retry later.'}, status=400)
            return JsonResponse({'success': True, 'message': 'Report sent'}, status=200)
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)


def shared_users_list(request, id):
    shared_users = SharedUsers.objects.filter(belongs_to_id=id).values(
        'user__id', 'user__first_name', 'user__last_name', 'user__email',
        'user__phone_number', 'user__role'
    )
    shared_users = list(shared_users)
    belongs_to_user = get_object_or_404(User, id=id)
    belongs_to_details = {
        'user__id': belongs_to_user.id,
        'user__first_name': belongs_to_user.first_name,
        'user__last_name': belongs_to_user.last_name,
        'user__email': belongs_to_user.email,
        'user__phone_number': belongs_to_user.phone_number,
        'user__role': belongs_to_user.role
    }
    shared_users.insert(0, belongs_to_details)

    return JsonResponse(shared_users, safe=False)