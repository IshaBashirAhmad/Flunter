import stripe
from django.shortcuts import render, redirect
from flunter.decorators import admin_exclusion
from users.models import Company, CustomPlan, Subscription, User, UserProfile, Contact
from web.models import SharedUsers, Searches
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.db.models import Q
from django.utils.timezone import now
from flunter.decorators import user_signin_required


stripe.api_key = settings.STRIPE_SECRET_KEY


# -----------------------------------------------
def get_subscription_plan(request, parent):
    context = {}
    context['is_custom_plan'] = False
    try:
        if request.user.role == User.Roles.AUTH_USER:
            auth_user_count = SharedUsers.objects.filter(belongs_to=SharedUsers.objects.get(user=request.user).belongs_to).count()
            # sub = Subscription.objects.get(user=SharedUsers.objects.get(user=request.user).belongs_to)
        elif request.user.role == User.Roles.CONTACT:
            auth_user_count = SharedUsers.objects.filter(belongs_to=Contact.objects.get(user=request.user).company.user).count()
            # sub = Subscription.objects.get(user = Contact.objects.get(user=request.user).company.user)
        else:
            auth_user_count = SharedUsers.objects.filter(belongs_to=request.user).count()
            # sub = Subscription.objects.get(user=request.user)
        try:
            custom_plan = CustomPlan.objects.get(user=parent)
            sub = custom_plan
            context['is_custom_plan'] = True
        except Exception as e:
            print(e)
            sub = Subscription.objects.get(user=parent)
            if sub.is_trial == True:
                current_datetime = now()
                if sub.next_payment_date and current_datetime >= sub.next_payment_date:
                    sub.delete()
                    sub = None
    except Exception as e:
        print(e)
        auth_user_count = 0
        sub = None
        
    context['auth_user_count'] = auth_user_count
    context['sub'] = sub
    return context


def get_parent_user(request):
    if request.user.role == User.Roles.AUTH_USER:
        parent = request.user.shared_user_profile.belongs_to
    elif request.user.role == User.Roles.CONTACT:
        parent = request.user.contact_profile.company.user
    else:
        parent = request.user
    return parent


@admin_exclusion
def homepage(request):
    context = {}
    context['use_trial'] = False
    context['is_custom_plan'] = False
    if request.user.is_authenticated:
        context['is_login'] = True
        parent = get_parent_user(request)
        user_subscription_plan = get_subscription_plan(request, parent)
        sub = user_subscription_plan['sub']
        context['is_custom_plan'] = user_subscription_plan['is_custom_plan']
        if parent.has_used_trial == False and sub == None:
            context['use_trial'] = True
    else:
        sub = None
        parent = None
        context['use_trial'] = False
    if sub is not None and context['is_custom_plan'] == False:
        if sub.next_payment_date is not None:
            context['remaining_days'] = (sub.next_payment_date - now()).days + 1
    
    context['current_plan'] = sub
    context['parent'] = parent
    context['active_page'] = 'home'
    context['key'] = settings.GOOGLE_MAPS_API_KEY
    return render(request, 'index.html', context)


@admin_exclusion
def searchpage(request):
    context = {}
    if request.user.is_authenticated:
        context['is_login'] = True
    return render(request, 'search-page.html', context)


@admin_exclusion
def terms_and_conditions(request):
    context = {}
    if request.user.is_authenticated:
        context['is_login'] = True
    return render(request, 'terms-and-conditions.html', context)


@admin_exclusion
def privacy_policy(request):
    context = {}
    if request.user.is_authenticated:
        context['is_login'] = True
    return render(request, 'privacy-policy.html', context)


@admin_exclusion
def security_policy(request):
    context = {}
    if request.user.is_authenticated:
        context['is_login'] = True
    return render(request, 'security-policy.html', context)


@admin_exclusion
def opt_out(request):
    context = {}
    if request.user.is_authenticated:
        context['is_login'] = True
    return render(request, 'opt-out.html', context)


@admin_exclusion
def login(request):
    context = {}
    if request.user.is_authenticated:
        return redirect('/')
    context['is_mobile'] = request.user_agent.is_mobile
    context['is_login'] = False
    return render(request, 'authentication/login.html', context)


@admin_exclusion
def signup(request):
    context = {}
    if request.user.is_authenticated:
        return redirect('/')
    context['is_login'] = False
    context['key'] = settings.GOOGLE_MAPS_API_KEY
    return render(request, 'authentication/signup.html', context)


@admin_exclusion
def forgot_password(request):
    context = {}
    if request.user.is_authenticated:
        return redirect('/')
    context['is_login'] = False
    context['hide_nav_func'] = True
    return render(request, 'authentication/forgot-password.html', context)


@admin_exclusion
def verify_code(request):
    context = {}
    if request.user.is_authenticated:
        return redirect('/')
    context['is_login'] = False
    context['hide_nav_func'] = True
    return render(request, 'authentication/verify-code.html', context)


@admin_exclusion
def reset_password(request, token):
    context = {}
    # code, email = decrypt_token(token)
    # context['reset_email'] = email
    if request.user.is_authenticated:
        return redirect('/')
    context['is_login'] = False
    context['hide_nav_func'] = True
    return render(request, 'authentication/reset-password.html', context)


@user_signin_required
def search_profile(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'search'
    context['use_trial'] = False
    context['key'] = settings.GOOGLE_MAPS_API_KEY
    context['AISEARCHBOT_URL'] = settings.AISEARCHBOT_URL
    return render(request, 'company/search-profile.html', context)


@login_required(login_url='/login/')
def recent_searches(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'recent_search'
    if request.user.is_superuser:
        return redirect('/')
    
    parent = get_parent_user(request)
    user_subscription_plan = get_subscription_plan(request, parent)
    sub = user_subscription_plan['sub']
    context['is_custom_plan'] = user_subscription_plan['is_custom_plan']
    context['current_plan'] = sub
    return render(request, 'company/recent-searches.html', context)


@user_signin_required
def saved_searches(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'saved_search'
    return render(request, 'company/saved-searches.html', context)


@login_required(login_url='/login/')
def credit_balance(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'credits'
    if request.user.is_superuser:
        return redirect('/')
    context['authorised_users'] = SharedUsers.objects.filter(belongs_to=request.user).order_by('-id')
    context['current_user'] = request.user
    
    try:
        invoices = stripe.Invoice.list(
            status='paid',
            limit=100,
            customer=request.user.stripe_id
        )
    except Exception as e:
        print(e)
        invoices = []

    context['invoices'] = invoices
    
    parent = get_parent_user(request)
    user_subscription_plan = get_subscription_plan(request, parent)
    sub = user_subscription_plan['sub']
    auth_user_count = user_subscription_plan['auth_user_count']
    
    try:
        payment_method = stripe.PaymentMethod.retrieve(request.user.payment_method_id)
    except Exception as e:
        print(e)
        payment_method = None

    shared_users_ids = SharedUsers.objects.filter(belongs_to=parent).values_list('user_id', flat = True)
    query_object = Q(user = parent) | Q(user_id__in= shared_users_ids)
    if parent.role == User.Roles.COMPANY:
        contacts_ids = Contact.objects.filter(company = parent.company_profile).values_list('user_id', flat=True)
        query_object |= Q(user_id__in = contacts_ids)
    
    saved_search_count = Searches.objects.filter((query_object), search_type=Searches.Types.Saved, is_deleted = False).count()
    context['saved_search_count'] = saved_search_count or 0
    context['payment_method'] = payment_method
    context['auth_user_count'] = auth_user_count or 0
    context['is_custom_plan'] = user_subscription_plan['is_custom_plan']
    if sub is not None and context['is_custom_plan'] == False:
        context['used_credits'] = sub.plan.credits -  sub.remaining_credits
        context['total_credits'] = sub.plan.credits

        user_plan_limit = sub.plan.users_limit
        if user_plan_limit is not None: 
            auth_user_count = context['authorised_users'].count()
            if auth_user_count >= user_plan_limit:
                context['disable_add_auth_user'] = True
        if sub.next_payment_date is not None:
            context['remaining_days'] = (sub.next_payment_date - now()).days + 1
        context['current_plan'] = sub
    elif sub is not None and context['is_custom_plan'] == True:
        context['used_credits'] = sub.credits -  sub.remaining_credits 
        context['total_credits'] = sub.credits
        user_plan_limit = sub.users_limit
        auth_user_count = context['authorised_users'].count()
        if auth_user_count >= user_plan_limit:
            context['disable_add_auth_user'] = True
        context['current_plan'] = sub
    else:
        context['current_plan'] = None
    
    return render(request, 'company/account.html', context)


@user_signin_required
def my_account(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'my_account'
    context['stripe_publishable_key'] = settings.STRIPE_PUBLIC_KEY    
    return render(request, 'company/account.html', context)


@user_signin_required
def change_personal_info(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'my_account'
    return render(request, 'company/update-personal-info.html', context)


@user_signin_required
def subscription(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'my_account'
    context['stripe_publishable_key'] = settings.STRIPE_PUBLIC_KEY
    return render(request, 'company/subscription.html', context)


@user_signin_required
def subscription_successful(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'my_account'
    return render(request, 'company/subscription-success.html', context)


@user_signin_required
def plans_comparison(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'my_account'
    context['stripe_publishable_key'] = settings.STRIPE_PUBLIC_KEY
    return render(request, 'company/plans-comparison.html', context)


@user_signin_required
def resources(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'resources'
    return render(request, 'company/resources.html', context)


#saved profile
@user_signin_required
def saved_profiles(request):
    context = {}
    context['active_sidebar'] = 'saved_profiles'
    # context['is_login'] = True
    # if request.user.is_superuser:
    #     return redirect('/')
    
    # parent = get_parent_user(request)
    # user_subscription_plan = get_subscription_plan(request, parent)
    # sub = user_subscription_plan['sub']
    # context['is_custom_plan'] = user_subscription_plan['is_custom_plan']
    # context['current_plan'] = sub
    # context['AISEARCHBOT_URL'] = settings.AISEARCHBOT_URL
    # context['parent_user'] = parent.id
    # context['key'] = settings.GOOGLE_MAPS_API_KEY
    return render(request, 'company/saved-profiles.html', context)


@user_signin_required
def opened_profiles(request):
    context = {}
    context['active_sidebar'] = 'opened_profiles'
    # context['is_login'] = True
    # if request.user.is_superuser:
    #     return redirect('/')
    
    # parent = get_parent_user(request)
    # user_subscription_plan = get_subscription_plan(request, parent)
    # sub = user_subscription_plan['sub']
    # context['is_custom_plan'] = user_subscription_plan['is_custom_plan']
    # context['current_plan'] = sub
    # context['AISEARCHBOT_URL'] = settings.AISEARCHBOT_URL
    # context['parent_user'] = parent.id
    return render(request, 'company/opened-profiles.html', context)


@user_signin_required
def list_candidates(request, pk):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'my_list'
    context['list_id'] = pk
    return render(request, 'company/list-candidates.html', context)

    
    
# Temporary view to create stripe ids for already created users

def create_stripe_ids(request):
    users = User.objects.all()
    for user in users:
        if user.stripe_id == '':
            try:
                stripe_customer = stripe.Customer.create(email=user.email)
                user.stripe_id = stripe_customer.id
                user.save()
            except stripe.error.StripeError as e:
                print("Stripe Error:", str(e))
    return redirect('/')


# Temporary view to create default free subscription for already created users

def create_default_subscriptions(request):
    users = User.objects.all()
    for user in users:
        if hasattr(user, 'subscription'):
            print('subscribed')
        else:
            try:
                print('not subscribed')
                update_fields = {'plan_id': 1, 'stripe_subscription_id': '', 'latest_payment_client_secret': '', 'status': Subscription.Status.ACTIVE}
                subscription = Subscription.objects.update_or_create(user=user, defaults=update_fields)
            except Exception as e:
                print(e)
    return redirect('/')


# # Temporary view to delete all candidates

# def delete_all_candidates(request):
#     CandidateProfiles.objects.all().delete()
#     return redirect('/')


# # Temporary view to delete all duplicates

# def delete_all_duplicates(request):
#     DuplicateProfiles.objects.all().delete()
#     return redirect('/')


# Temporary view to delete all saved searches

@login_required(login_url='/login/')
def delete_saved_searches(request):
    Searches.objects.filter(search_type=Searches.Types.Saved).delete()
    return redirect('/saved-searches')


# mylist

@user_signin_required
def my_list(request):
    context = {}
    context['active_sidebar'] = 'my_list'
    return render(request, 'company/my-list.html', context)


@user_signin_required
def shared_profile(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'shared_profiles'
    return render(request, 'company/shared-profile.html', context)


@user_signin_required
def specific_shared_profile(request, pk):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'shared_profiles'
    context['list_id'] = pk
    return render(request, 'company/specific-shared-profile.html', context)


@user_signin_required
def activities(request):
    context = {}
    context['active_sidebar'] = 'activities'
    return render(request, 'company/activities.html', context)


@user_signin_required
def specific_activity_profile(request, pk):
    context = {}
    context['active_sidebar'] = 'activities'
    context['list_id'] = pk
    return render(request, 'company/specific-activity-profile.html', context)


@user_signin_required
def needs(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'needs'
    return render(request, 'company/needs.html', context)