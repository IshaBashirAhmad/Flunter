import json
from users.forms import CustomUserCreationForm, CustomUserUpdateForm, UserProfileForm
from django.contrib.auth.forms import AuthenticationForm, SetPasswordForm, PasswordChangeForm
from users.models import Contact, CustomPlan, User, OTP, Company, UserProfile, Subscription
from .forms import  ContactProfileForm, UserChangeForm, FlunterInfoUpdateForm, CompanyAddForm
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from flunter.helpers import ValuesQuerySetToDict, send_verification_code_email,send_account_credentials_email
from django.contrib.auth import login, authenticate,logout,get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash
from flunter.helpers import queryDict_to_dict
from django.shortcuts import render, redirect
from flunter.decorators import staff_required, redirect_if_logged_in
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from .models import FlunterInfo
from web.models import Searches, SharedUsers
from django.utils import timezone
from datetime import datetime, timedelta
from django.utils.timezone import now
import pytz
from django.http import JsonResponse
from django.conf import settings
import stripe
from django.db.models import Q

stripe.api_key = settings.STRIPE_SECRET_KEY

#authentication
@redirect_if_logged_in
def admin_login(request):
    context = {}
    context['hide_nav_func'] = True
    form = AuthenticationForm()
    if request.method == 'POST':
            email = request.POST.get('username')
            password = request.POST.get('password')
            try:
                user = User.objects.get(email = email)
                if user is not None:
                    if user.is_active:
                        form = AuthenticationForm(request, data=request.POST)
                        if form.is_valid():
                            user = authenticate(request, email=email, password=password)
                            if user is not None and user.is_staff:
                                login(request, user)
                                return redirect('dashboard') 
                            else:
                                messages.error(request, 'You are not authorised person.') 
                    else:
                        messages.error(request, "Your account temporarily suspended, contact to the system's admin.")
            except Exception as e:
                print(e)
                messages.error(request,'This email is not registered.')
    context['form'] = form
    return render(request, 'administration/authentication/login.html', context)


def admin_logout(request):
    logout(request)
    return redirect('login')


@redirect_if_logged_in
def send_otp(request):
    context = {}
    context['hide_nav_func'] = True
    if request.method == "POST":
            try:
                email = request.POST.get('email')
                user = User.objects.filter(email=email).first()
                if user is None:
                    messages.error(request,'This email is not registered.')
                else:
                    token = send_verification_code_email(email)
                    if token == False:
                        messages.error(request, 'Could not send email, retry later.')                    
                    else:
                        request.session['email'] = email
                        return redirect('verify_code')
            except Exception as e:
                messages.error(request, 'Something bad happened')
    return render(request, 'administration/authentication/forgot-password.html', context)

@redirect_if_logged_in
def verify_code(request):
    context = {}
    context['is_login'] = False
    context['hide_nav_func'] = True
    context['email'] = request.session.get('email')
    
    if request.method == "POST":
       try:
        code1 = request.POST.get('code1')
        code2 = request.POST.get('code2')
        code3 = request.POST.get('code3')
        code4 = request.POST.get('code4')
        code5 = request.POST.get('code5')
        code6 = request.POST.get('code6')

        code  = code1 + code2 + code3 + code4 + code5 + code6
        otp_record = OTP.objects.filter(email = context['email']).first()
        if otp_record is None:
                messages.error(request, 'Verification code not found.')
        elif otp_record.used == True:
                messages.error(request, 'Verification code already used.')
        elif timezone.now() > otp_record.timeout:
                messages.error(request, 'Verification code timeout.')
        elif int(code) != otp_record.code:
                messages.error(request, 'Verification code is invalid.')
        else:
            otp_record.used = True
            otp_record.save(update_fields=['used'])
            messages.success(request, 'Verification code successfully verified')
            return redirect('reset_password')
       
       except Exception as e:
           messages.error(request, 'Something bad happened')

    return render(request, 'administration/authentication/verify-code.html', context)

@redirect_if_logged_in
def reset_password(request):
    context = {
        'is_login': False,
        'hide_nav_func': True,
    }
    
    try:
        email = request.session.get('email')
        if email:
            user = User.objects.get(email=email)
            form = SetPasswordForm(user=user)
            
            if request.method == 'POST':
                form = SetPasswordForm(data=request.POST, user=user)
                if form.is_valid():
                    form.save()
                    messages.success(request, 'Password is successfully reset')
                    return redirect('login')
        else:
            form = None
            # messages.error(request, 'Email not found.')
    except User.DoesNotExist:
        form = None
        messages.error(request, 'User with the provided email does not exist.')
    except Exception as e:
        form = None
        messages.error(request, f'An error occurred: {str(e)}')

    context['form'] = form if form else None
    return render(request, 'administration/authentication/reset-password.html', context)


# authorised users
@staff_required
@login_required(login_url='login')
def add_authorised_user(request):
    if request.method == "POST":
        data = request.POST.copy()
        if 'profile_picture' in request.FILES:
            data['profile_picture'] = request.FILES['profile_picture']
        data = queryDict_to_dict(data)
        try:
            if User.objects.filter(email__iexact=data.get('email')).exists():
                return JsonResponse({'success': False, 'message': 'User already exists'}, status=409)
            
            user = get_user_model().objects.create_superuser(
                    email=data.get('email'),
                    password=data.get('password1'),
                    first_name=data.get('first_name'),
                    role='admin',
                    is_superadmin = False
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
            return JsonResponse({'success': True, 'message': 'User created'}, status=201)

        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'message': 'Something bad happened'}, status=500)
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)

@csrf_exempt
@staff_required
@login_required(login_url='login')
def delete_user(request, pk):
    context={}
    if request.method == 'DELETE':
        try:
            try:
                user = User.objects.get(id=int(pk))
            except Exception as e:
                user = None
            if user is None:
                context['success'] = False
                context['message'] = 'User not found'
                messages.error(request, 'User not found')
                return JsonResponse(context, status=404)
            else:
                user.delete()
                context['success'] = True
                context['message'] = 'User deleted.'
                messages.success(request, 'User successfully deleted.')
                return JsonResponse(context, status=200)
        except Exception as e:
            print(e)
            context['success'] = False
            context['message'] = 'Something bad happened'
            messages.error(request, 'Something bad happened')
            return JsonResponse(context, status=500)
    context['success'] = False
    context['message'] = 'Invalid request'
    messages.error(request, 'Invalid request')
    return JsonResponse({'success': False, 'message': 'Invalid request'}, status=400)



# dashboard
@csrf_exempt
@staff_required
@login_required(login_url='login')
def dashboard(request):
    context={}
    context['startdate'] = request.GET.get('start_date')
    context['enddate'] = request.GET.get('end_date')
    context['searchtype'] = request.GET.get('search-type')
    
    searches = Searches.objects.all()
    subscriptions = Subscription.objects.all()

    search_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    # Initialize the data structures
    current_year = datetime.now().year
    number_of_searches = [0] * 12
    number_of_searches_without_results = [0] * 12
    total_results_per_month = [0] * 12
    active_subscriptions = [0] * 12
    
    # Initialize the data structures for subscriptions
    active_subscriptions_silver = [0] * 12
    active_subscriptions_gold = [0] * 12
    active_subscriptions_platinum = [0] * 12
    active_subscriptions_enterprise = [0] * 12

    # Aggregate searches by month of the year
    for search in searches:
        month_of_year = search.created_at.month - 1  # months are 1-12 in datetime, subtract 1 to make it 0-11
        number_of_searches[month_of_year] += 1
        if search.number_of_results is None or search.number_of_results == 0:
            number_of_searches_without_results[month_of_year] += 1
        number_of_results = search.number_of_results if search.number_of_results is not None else 0
        total_results_per_month[month_of_year] += number_of_results

    # Calculate average results per search
    average_results_per_search = [
        total_results_per_month[i] / number_of_searches[i] if number_of_searches[i] > 0 else 0
        for i in range(12)
    ]
    
    for subs in subscriptions.filter(subscription_interval='yearly', created_at__year=current_year):
        month_of_year = subs.created_at.month - 1
        active_subscriptions[month_of_year] += 1 
        if subs.plan.name == 'Silver':
            active_subscriptions_silver[month_of_year] += 1
        elif subs.plan.name == 'Gold':
            active_subscriptions_gold[month_of_year] += 1
        elif subs.plan.name == 'Platinum':
            active_subscriptions_platinum[month_of_year] += 1
        elif subs.plan.name == 'Enterprise':
            active_subscriptions_enterprise[month_of_year] += 1
    
    active_companies = Company.objects.filter(user__subscription__plan_id=1, user__role = 'company' ).count()
    inactive_comapnies =  Company.objects.all().exclude(user__subscription__plan_id=1, user__role = 'company').count()
   
    idividual_free_subscribers = User.objects.filter(subscription__plan = 1, role = 'user').count()
    idividual_other_subscribers = User.objects.all().exclude(subscription__plan = 1, role = 'user').count()
    
    free_subscriptions = Subscription.objects.filter(plan__id = 1).count()
    other_subscriptions = Subscription.objects.all().exclude(plan__id = 1).count()
    
    seven_days_ago = timezone.now() - timedelta(days=7)
    all_contacts = Contact.objects.all()
    active_contacts = all_contacts.filter(user__last_login__gt=seven_days_ago).count()
    inactive_contacts = all_contacts.filter(Q(user__last_login__lt=seven_days_ago) | Q(user__last_login=None)).count()
    
    context['active_sidebar'] = 'dashboard'
    context['search_labels'] = search_labels
    context['number_of_searches'] = number_of_searches
    context['number_of_searches_without_results'] = number_of_searches_without_results
    context['average_results_per_search'] = average_results_per_search
    context['total_results_per_month'] = total_results_per_month
    context['active_companies'] = active_companies
    context['inactive_comapnies'] = inactive_comapnies
    context['idividual_free_subscribers'] = idividual_free_subscribers
    context['idividual_other_subscribers'] = idividual_other_subscribers
    context['free_subscriptions'] = free_subscriptions
    context['other_subscriptions'] = other_subscriptions
    context['active_subscriptions'] = active_subscriptions
    context['active_contacts'] = active_contacts
    context['inactive_contacts'] =  inactive_contacts
    
    context['active_subscriptions_silver'] = active_subscriptions_silver
    context['active_subscriptions_gold'] = active_subscriptions_gold
    context['active_subscriptions_platinum'] = active_subscriptions_platinum
    context['active_subscriptions_enterprise'] = active_subscriptions_enterprise
    
    return render(request, 'administration/dashboard/dashboard.html', context)

def get_monthly_revenue(year):
    start_date = datetime(year, 1, 1)
    end_date = datetime(year + 1, 1, 1)

    start_timestamp = int(start_date.timestamp())
    end_timestamp = int(end_date.timestamp())

    # Retrieve all invoices for the specified period
    all_invoices = get_all_invoices(start_timestamp, end_timestamp)
    # Initialize a list to store revenue per month
    monthly_revenue = [0] * 12
    # Calculate total revenue per month
    for invoice in all_invoices:
        invoice_date = datetime.fromtimestamp(invoice['created'])
        month = invoice_date.month
        monthly_revenue[month - 1] += invoice['amount_paid']/100 

    return monthly_revenue

def get_all_invoices(start_timestamp, end_timestamp):
        all_invoices = []
        has_more = True
        starting_after = None

        while has_more:
            params = {
                'created': {
                    'gte': start_timestamp,
                    'lt': end_timestamp,
                },
                'status': 'paid',
                'limit': 100
            }

            if starting_after:
                params['starting_after'] = starting_after

            invoices = stripe.Invoice.list(**params)
            all_invoices.extend(invoices['data'])
            has_more = invoices['has_more']
            if has_more:
                starting_after = invoices['data'][-1]['id']

        return all_invoices

@csrf_exempt
def get_yearly_revenue(request):
        context={}
        search_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        if request.method == 'POST':
            now = datetime.now()
            start_date = datetime(now.year, 1, 1)
            end_date = datetime(now.year + 1, 1, 1)
            end_date = end_date + timedelta(seconds=59, minutes=59, hours=23)
            
            start_timestamp = int(start_date.timestamp())
            end_timestamp = int(end_date.timestamp())
            
            invoices = get_all_invoices(start_timestamp, end_timestamp)   
            total_revenue = sum(invoice['amount_paid'] for invoice in invoices)
            getmonthlyrevenue = get_monthly_revenue(now.year)
                
            # Calculate the previous period dates
            previous_start_date = start_date - (end_date - start_date)
            previous_end_date = start_date - timedelta(days=1)

            # Convert previous period dates to timestamps
            prev_start_timestamp = int(previous_start_date.timestamp())
            prev_end_timestamp = int(previous_end_date.timestamp())

            # Fetch all invoices within the previous period
            previous_invoices = get_all_invoices(prev_start_timestamp, prev_end_timestamp)

            # Calculate total revenue for the previous period
            previous_revenue = sum(invoice['amount_paid']/100 for invoice in previous_invoices)
            
            # Calculate the percentage change
            if previous_revenue == 0:
                revenue_percentage_change = 100.0 if total_revenue > 0 else 0.0
            else:
                revenue_percentage_change = ((total_revenue - previous_revenue) / previous_revenue) * 100
                
            context['search_labels'] = search_labels
            context['revenue_percentage_change'] = revenue_percentage_change
            context['total_revenue'] = total_revenue/100
            context['get_monthly_revenue'] = getmonthlyrevenue
            context['success'] = True
            return JsonResponse(context)
        else:
            context['success'] = False
            return JsonResponse(context)
    
def get_last_n_years(n=0):
    current_year = datetime.now().year
    last_n_years = [year for year in range(current_year, current_year - n - 1, -1)]
    return last_n_years


def dashboard_data(request):
    context={}
    if request.method == 'POST':
        context['startdate'] = request.POST.get('start_date')
        context['enddate'] = request.POST.get('end_date')
        context['searchtype'] = request.POST.get('search-type')
        context['local_tz'] = request.POST.get('local_tz')
        context['selected_interval'] = request.POST.get('selected_interval')
        context['selected_year'] = request.POST.get('selected_year')
        context['revenue_start_date'] = request.POST.get('revenue_start_date')
        context['revenue_end_date'] = request.POST.get('revenue_end_date')
        
        local_tz = pytz.timezone(context['local_tz'])
        searches = Searches.objects.all()
        subscriptions = Subscription.objects.all()
        
        categories = ['Silver', 'Gold', 'Platinum', 'Enterprise']
        last_five_years = get_last_n_years(5)
        
        if context['searchtype'] == 'Today':
            search_labels = ['02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22', '24']
            
            today = datetime.now(local_tz).date()
            # Filter searches to include only those created today in local time zone
            todays_searches = [
                search for search in searches
                if search.created_at.astimezone(local_tz).date() == today
            ]
            # Initialize the data structures
            number_of_searches = [0] * 12
            number_of_searches_without_results = [0] * 12
            total_results_per_hour = [0] * 12
            subscriptions_per_hour = [0] * 12

            # Aggregate searches by hour of the day in local time zone
            for search in todays_searches:
                hour_of_day = search.created_at.astimezone(local_tz).hour // 2  # Convert to local time and get the hour
                number_of_searches[hour_of_day] += 1
                if search.number_of_results is None or search.number_of_results == 0:
                    number_of_searches_without_results[hour_of_day] += 1
                number_of_results = search.number_of_results if search.number_of_results is not None else 0
                total_results_per_hour[hour_of_day] += number_of_results

            # Calculate average results per search
            average_results_per_search = [
                total_results_per_hour[i] / number_of_searches[i] if number_of_searches[i] > 0 else 0
                for i in range(12)
            ]

            # Filter subscriptions to include only those created today in local time zone
            todays_subscriptions = [
                subs for subs in subscriptions
                if subs.created_at.astimezone(local_tz).date() == today
            ]
            
            for subs in todays_subscriptions:
                hour_of_day = subs.created_at.astimezone(local_tz).hour // 2  # Convert to local time and get the hour
                subscriptions_per_hour[hour_of_day] += 1

            context['number_of_searches'] = number_of_searches
            context['search_labels'] = search_labels
            # context['average_results_per_search'] = average_results_per_search
            # context['subscriptions_per_hour'] = subscriptions_per_hour

        elif context['searchtype'] == 'This Month':
            current_date = now()
            current_year = current_date.year
            current_month = current_date.month
            searches = searches.filter(created_at__year=current_year, created_at__month=current_month)
            subscriptions = subscriptions.filter(created_at__year=current_year, created_at__month=current_month)
            search_labels = ['week 01', 'week 02', 'week 03', 'week 04']
            
            # Initialize the data structures
            number_of_searches = [0] * 4
            number_of_searches_without_results = [0] * 4
            total_results_per_week = [0] * 4
            subscriptions_per_week = [0] * 4

            # Aggregate searches by week of the month
            for search in searches:
                week_of_month = min((search.created_at.day - 1) // 7, 3)
                number_of_searches[week_of_month] += 1
                if search.number_of_results is None or search.number_of_results == 0:
                    number_of_searches_without_results[week_of_month] += 1
                number_of_results = search.number_of_results if search.number_of_results is not None else 0
                total_results_per_week[week_of_month] += number_of_results

            # Calculate average results per search
            average_results_per_search = [
                total_results_per_week[i] / number_of_searches[i] if number_of_searches[i] > 0 else 0
                for i in range(4)
            ]

            for subs in subscriptions:
                week_of_month = min((subs.created_at.day - 1) // 7, 3)
                subscriptions_per_week[week_of_month] += 1
                
            context['number_of_searches'] = number_of_searches
            context['search_labels'] = search_labels
                       
        elif context['searchtype'] == 'Overall':
            search_labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

            # Initialize the data structures
            number_of_searches = [0] * 7
            number_of_searches_without_results = [0] * 7 
            total_results_per_day = [0] * 7 
            subscriptions_per_day = [0] * 7
            revenue_per_day = [0] * 7
            
            # Aggregate searches by day of the week
            for search in searches:
                day_of_week = search.created_at.weekday() 
                number_of_searches[day_of_week] += 1  
                if search.number_of_results is None or search.number_of_results == 0:
                    number_of_searches_without_results[day_of_week] += 1
                number_of_results = search.number_of_results if search.number_of_results is not None else 0
                total_results_per_day[day_of_week] += number_of_results
                    
            # Calculate average results per search
            average_results_per_search = [
                total_results_per_day[i] / number_of_searches[i] if number_of_searches[i] > 0 else 0
                for i in range(7)
            ]
            
            for subs in subscriptions:
                day_of_week = subs.created_at.weekday()
                subscriptions_per_day[day_of_week] += 1
            context['number_of_searches'] = number_of_searches
            context['search_labels'] = search_labels
        
        elif context['startdate'] and context['enddate']:
            search_labels = []
            start_date = datetime.strptime(context['startdate'], '%Y-%m-%d').astimezone(local_tz)
            end_date = datetime.strptime(context['enddate'], '%Y-%m-%d').astimezone(local_tz)
            
            start_date = start_date.replace(hour=0, minute=0, second=0)
            end_date = end_date.replace(hour=23, minute=59, second=59)
            
            current_date = start_date
            while current_date <= end_date:
                search_labels.append(current_date.strftime('%Y-%m-%d'))
                current_date += timedelta(days=1)

            # Filter searches to include only those created between start_date and end_date in local time zone
            date_range_searches = [
                search for search in searches
                if start_date <= search.created_at.astimezone(local_tz) <= end_date
            ]
            
            # Initialize the data structures
            number_of_searches = [0] * len(search_labels)
            number_of_searches_without_results = [0] * len(search_labels)
            total_results_per_day = [0] * len(search_labels)
            subscriptions_per_day = [0] * len(search_labels)

            # Aggregate searches by day in local time zone
            for search in date_range_searches:
                day_index = (search.created_at.astimezone(local_tz).date() - start_date.date()).days
                number_of_searches[day_index] += 1
                if search.number_of_results is None or search.number_of_results == 0:
                    number_of_searches_without_results[day_index] += 1
                number_of_results = search.number_of_results if search.number_of_results is not None else 0
                total_results_per_day[day_index] += number_of_results

            # Calculate average results per search
            average_results_per_search = [
                total_results_per_day[i] / number_of_searches[i] if number_of_searches[i] > 0 else 0
                for i in range(len(search_labels))
            ]

            # Filter subscriptions to include only those created between start_date and end_date in local time zone
            date_range_subscriptions = [
                subs for subs in subscriptions
                if start_date <= subs.created_at.astimezone(local_tz) <= end_date
            ]
            
            for subs in date_range_subscriptions:
                day_index = (subs.created_at.astimezone(local_tz).date() - start_date.date()).days
                subscriptions_per_day[day_index] += 1

            context['number_of_searches'] = number_of_searches
            context['search_labels'] = search_labels
            context['number_of_searches_without_results'] = number_of_searches_without_results
            context['average_results_per_search'] = average_results_per_search
            context['subscriptions_per_day'] = subscriptions_per_day
                              
        else:
            current_date = now()
            current_year = current_date.year
            searches = searches.filter(created_at__year=current_year)
            subscriptions = subscriptions.filter(created_at__year=current_year)
            search_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

            # Initialize the data structures
            number_of_searches = [0] * 12
            number_of_searches_without_results = [0] * 12
            total_results_per_month = [0] * 12
            subscriptions_per_month = [0] * 12

            # Aggregate searches by month of the year
            for search in searches:
                month_of_year = search.created_at.month - 1  # months are 1-12 in datetime, subtract 1 to make it 0-11
                number_of_searches[month_of_year] += 1
                if search.number_of_results is None or search.number_of_results == 0:
                    number_of_searches_without_results[month_of_year] += 1
                number_of_results = search.number_of_results if search.number_of_results is not None else 0
                total_results_per_month[month_of_year] += number_of_results

            # Calculate average results per search
            average_results_per_search = [
                total_results_per_month[i] / number_of_searches[i] if number_of_searches[i] > 0 else 0
                for i in range(12)
            ]

            for subs in subscriptions:
                month_of_year = subs.created_at.month - 1
                subscriptions_per_month[month_of_year] += 1
                
            context['number_of_searches'] = number_of_searches
            context['search_labels'] = search_labels
      
        if context['selected_interval'] in ['monthly', 'yearly'] or context['selected_year'] in last_five_years:
            interval = context['selected_interval']
            year = context['selected_year']
            search_labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            number_of_searches = [0] * 12
            number_of_searches_without_results = [0] * 12
            active_subscriptions = [0] * 12
            revenue_per_month = [0] * 12
            
            # Initialize the data structures for subscriptions
            active_subscriptions_silver = [0] * 12
            active_subscriptions_gold = [0] * 12
            active_subscriptions_platinum = [0] * 12
            active_subscriptions_enterprise = [0] * 12

            filtered_subscriptions = subscriptions.filter(subscription_interval=interval).filter(Q(created_at__year=year))
            for subs in filtered_subscriptions:
                month_of_year = subs.created_at.month - 1
                active_subscriptions[month_of_year] += 1 
                if subs.plan.name == 'Silver':
                    active_subscriptions_silver[month_of_year] += 1
                elif subs.plan.name == 'Gold':
                    active_subscriptions_gold[month_of_year] += 1
                elif subs.plan.name == 'Platinum':
                    active_subscriptions_platinum[month_of_year] += 1
                elif subs.plan.name == 'Enterprise':
                    active_subscriptions_enterprise[month_of_year] += 1

            context['search_labels'] = search_labels
            context['active_subscriptions'] = active_subscriptions   
            context['active_subscriptions_silver'] = active_subscriptions_silver
            context['active_subscriptions_gold'] = active_subscriptions_gold
            context['active_subscriptions_platinum'] = active_subscriptions_platinum
            context['active_subscriptions_enterprise'] = active_subscriptions_enterprise   
            
        if context['revenue_start_date'] and context['revenue_end_date']:
            try:
                search_labels = []
                start_date = datetime.strptime(context['revenue_start_date'], '%Y-%m-%d').astimezone(local_tz)
                end_date = datetime.strptime(context['revenue_end_date'], '%Y-%m-%d').astimezone(local_tz)
                end_date = end_date + timedelta(seconds=59, minutes=59, hours=23)
                
                current_date = start_date
                while current_date <= end_date:
                    search_labels.append(current_date.strftime('%Y-%m-%d'))
                    current_date += timedelta(days=1)

                # Convert dates to timestamps
                start_timestamp = int(start_date.timestamp())
                end_timestamp = int(end_date.timestamp())

                # Fetch all invoices within the date range
                all_invoices = get_all_invoices(start_timestamp, end_timestamp)  # Assumes this function fetches all invoices
                # Calculate total revenue for the selected date range
                total_revenue = sum(invoice['amount_paid']/100 for invoice in all_invoices)

                # Calculate monthly revenue
                monthly_revenue = [0] * len(search_labels)
                for invoice in all_invoices:
                    invoice_date = datetime.fromtimestamp(invoice['created']).astimezone(local_tz)
                    day_index = (invoice_date.date() - start_date.date()).days
                    monthly_revenue[day_index] += invoice['amount_paid']/100

                # Calculate the previous period dates
                previous_start_date = start_date - (end_date - start_date)
                previous_end_date = start_date - timedelta(days=1)

                
                previous_start_date = previous_start_date.replace(tzinfo=None)
                previous_end_date = previous_end_date.replace(tzinfo=None)
                
                previous_start_date = previous_start_date.replace(hour=0, minute=0, second=0)
                previous_end_date = previous_end_date.replace(hour=23, minute=59, second=59)
                
                # Convert previous period dates to timestamps
                prev_start_timestamp = int(previous_start_date.timestamp())
                prev_end_timestamp = int(previous_end_date.timestamp())

                # Fetch all invoices within the previous period
                previous_invoices = get_all_invoices(prev_start_timestamp, prev_end_timestamp)
                # Calculate total revenue for the previous period
                previous_revenue = sum(invoice['amount_paid']/100 for invoice in previous_invoices)
                # Calculate the percentage change
                if previous_revenue == 0:
                    revenue_percentage_change = 100.0 if total_revenue > 0 else 0.0
                else:
                    revenue_percentage_change = ((total_revenue - previous_revenue) / previous_revenue) * 100

                context['search_labels'] = search_labels
                context['total_revenue'] = total_revenue
                context['monthly_revenue'] = monthly_revenue
                context['revenue_percentage_change'] = revenue_percentage_change
            except ValueError as e:
                # Handle the error appropriately, maybe set default values or log the error
                context['search_labels'] = []
                context['total_revenue'] = 0
                context['monthly_revenue'] = {}
                context['revenue_percentage_change'] = 0.0
                print(f"Error parsing dates: {e}")

            
    context['success'] = True
    context['dataset'] = "dataset recieved.!!"
    return JsonResponse(context)


#contacts
@staff_required
@login_required(login_url= 'login')
def contacts(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'contacts'
    return render(request, 'administration/contact/contact-list.html', context)


@staff_required
@login_required(login_url='login')
def add_contact(request):
    context = {}
    context['active_sidebar'] = 'contacts'
    if request.method == 'POST':
        # password = User.objects.make_random_password()
        user_data = request.POST.copy()
        company_id = user_data.get('company', None)
        # user_data.update({"password1": password, "password2": password})
        user_form = CustomUserCreationForm(user_data)
        user_profile_form = ContactProfileForm(user_data)
        if user_form.is_valid() and user_profile_form.is_valid():
            user = user_form.save(commit=False)
            user.role = User.Roles.CONTACT
            user.save()
            profile = user_profile_form.save(commit=False)
            profile.user = user
            profile.save()
            email = user_data.get('email')
            password = user_data.get('password1')
            url=f'{settings.FRONTEND_URL}/login/'
            send_account_credentials_email(email, password, url)
            messages.success(request, 'New contact successfully added.')
            return redirect('contacts')
        else:
            if company_id is not None:
                company = Company.objects.get(id=int(company_id))
                company_name = company.company_name
                context['selected_company_name'] = company_name
                context['selected_company_id'] = int(company_id)
    else:    
        user_form = CustomUserCreationForm()
        user_profile_form = ContactProfileForm()

    companies = Company.objects.all().values()
    context['companies_data'] = ValuesQuerySetToDict(companies)
    context['user_form'] = user_form
    context['user_profile_form'] = user_profile_form
    return render(request, 'administration/contact/add-contact.html', context)


@staff_required
@login_required(login_url='login')
def contact_detail(request,pk):
    context = {}
    context['active_sidebar'] = 'contacts'
    contact = User.objects.get(id = pk)
    context['contact'] = contact

    context['is_custom_plan'] = False
    custom_plan = CustomPlan.objects.filter(user=context['contact'].contact_profile.company.user)
    sub_plan = Subscription.objects.filter(user=context['contact'].contact_profile.company.user)
    if custom_plan.exists():
        context['is_custom_plan'] = True
        context['contact_subs_plan'] = CustomPlan.objects.get(user=context['contact'].contact_profile.company.user)
    elif sub_plan.exists():
        context['contact_subs_plan'] = Subscription.objects.get(user=context['contact'].contact_profile.company.user)
        if context['contact_subs_plan'].next_payment_date is not None :
            context['remaining_days'] = (context['contact_subs_plan'].next_payment_date - timezone.now()).days
    else:
        context['contact_subs_plan'] = None

    # context['contact_subs_plan'] = Subscription.objects.get(user_id = context['contact'].contact_profile.company.user.id)
    context['saved_searches'] = Searches.objects.filter(user = contact, search_type = Searches.Types.Saved, is_deleted = False ).order_by('-created_at')[:5]
    context['recent_searches'] = Searches.objects.filter(user = contact, is_deleted =False).order_by('-created_at')[:5]
    context['user_id'] = pk
    return render(request, 'administration/contact/contact-detail.html', context)


@staff_required
@login_required(login_url='login')
def contact_update(request,pk):
    context = {}
    context['active_sidebar'] = 'contacts'

    contact_instance = User.objects.get(id = pk)
    context['selected_company'] = Company.objects.get(id=contact_instance.contact_profile.company_id)
    user_profile_instance = Contact.objects.get(user = contact_instance)
    user_form = CustomUserUpdateForm(instance=contact_instance)
    user_profile_form = ContactProfileForm(instance = user_profile_instance)

    if request.method == 'POST':
        user_data = request.POST.copy()
        company_id = user_data.get('company', None)
        user_form = CustomUserUpdateForm(request.POST, instance=contact_instance)
        user_profile_form = ContactProfileForm(request.POST, instance=user_profile_instance)
        if user_form.is_valid() and user_profile_form.is_valid():
            user = user_form.save()
            profile = user_profile_form.save(commit=False)
            profile.user = user
            profile.save()
            messages.success(request, 'Contact details successfully updated.')
            return redirect('contact_detail', pk=pk)
        else:
            if company_id is not None:
                context['selected_company'] = Company.objects.get(id=int(company_id))
    
    companies = Company.objects.all().values()
    context['companies_data'] = ValuesQuerySetToDict(companies)
    context['user_form'] = user_form
    context['user_profile_form'] = user_profile_form
    return render(request, 'administration/contact/contact-update.html', context)

@staff_required
@login_required(login_url='login')
def contact_search_list(request, pk, type):
    context = {}
    context['active_sidebar'] = 'contacts'
    context['company'] = User.objects.get(id = pk)
    if type =='Saved':
        context['show_time_result_field'] = False
        context['page_title'] = "Saved Searches"
        context['searches'] = Searches.objects.filter(user = context['company'], search_type = Searches.Types.Saved, is_deleted =False).order_by('-id')
    else:
        context['show_time_result_field'] = True
        context['page_title'] = "Recent Searches"
        context['searches'] = Searches.objects.filter(user = context['company'], is_deleted =False).order_by('-id')
    context['user_id'] = pk
    context['type'] = type
    
    paginator = Paginator(context['searches'], 20)  
    page = request.GET.get('page')  

    try:
        context['searches'] = paginator.page(page)
    except PageNotAnInteger:
        context['searches'] = paginator.page(1)
    except EmptyPage:
        context['searches'] = paginator.page(paginator.num_pages)
        
    return render(request, 'administration/contact/contact-search-list.html', context)   

# accounts
@staff_required
@login_required(login_url='login')
def my_account(request):
    context = {}
    context['active_sidebar'] = 'my_account'
    context['flunter'] = FlunterInfo.objects.first()
    context['auth_users'] = SharedUsers.objects.filter(belongs_to=request.user).order_by('-id')
    try:
        user = SharedUsers.objects.get(user=request.user)
        if user:
            context['disable_add_user'] = True
    except Exception as e:
        print(e)
    return render(request, 'administration/account/account.html', context)

@staff_required
@login_required(login_url='login')
def change_personal_info(request):
    context = {
        'active_sidebar': 'my_account'
    }
    user = request.user
    user_form = UserChangeForm(instance=user)
    
    if request.method == 'POST':
        user_form = UserChangeForm(request.POST, request.FILES, instance=user)
        user_form_valid = user_form.is_valid()
        
        if user_form_valid:
            user_form.save()
            messages.success(request, 'Your account details were successfully updated!')
            return redirect('my_account')
    
    context['form'] = user_form
    return render(request, 'administration/account/update-personal-info.html', context)

@staff_required
@login_required(login_url='login')
def change_flunter_info(request):
    context = {}
    context['is_login'] = True
    context['active_sidebar'] = 'my_account'
    flunter_instance = FlunterInfo.objects.first()  
    flunterform = FlunterInfoUpdateForm(instance=flunter_instance)
    if request.method == 'POST':
        flunterform = FlunterInfoUpdateForm(request.POST, instance=flunter_instance)
        if flunterform.is_valid():
            flunterform.save()
            messages.success(request, 'Account details were successfully updated!')
            return redirect('my_account')
        
    context['form'] = flunterform
    return render(request, 'administration/account/update-flunter-info.html', context)

@staff_required
@login_required(login_url='login')
def change_password(request):
    context = {
        'active_sidebar': 'my_account'
    }
    user = request.user
    password_form = PasswordChangeForm(user)
    if request.method == 'POST':
        password_form = PasswordChangeForm(user, request.POST)
        password_form_valid = password_form.is_valid()

        if password_form_valid:
            user = password_form.save()
            update_session_auth_hash(request, user)
            messages.success(request, 'Your password was successfully updated!')
            return redirect('my_account')

    context['passwordform'] = password_form
    return render(request, 'administration/account/change_password.html', context)


# company
@staff_required
@login_required(login_url='login')
def companies(request):
    context = {}
    context['active_sidebar'] = 'companies'
    company_records = User.objects.filter(role=User.Roles.COMPANY).order_by('-id')
    paginator = Paginator(company_records, 20)  
    page = request.GET.get('page')  

    try:
        companies = paginator.page(page)
    except PageNotAnInteger:
        companies = paginator.page(1)
    except EmptyPage:
        companies = paginator.page(paginator.num_pages)

    context['companies'] = companies
    return render(request, 'administration/company/companies-list.html', context)

@staff_required
@login_required(login_url='login')
def add_company(request):
    context = {}
    context['active_sidebar'] = 'companies'

    if request.method == 'POST':
        user_form = CustomUserCreationForm(request.POST)
        company_form = CompanyAddForm(request.POST)
        if user_form.is_valid() and company_form.is_valid():
            user = user_form.save(commit=False)
            user.role = User.Roles.COMPANY
            user.save()
            company = company_form.save(commit=False)
            company.user = user
            company.save()
            messages.success(request, 'New company successfully added.')
            return redirect('companies')
    else:    
        user_form = CustomUserCreationForm()
        company_form = CompanyAddForm()
    context['user_form'] = user_form
    context['form'] = company_form
    return render(request, 'administration/company/add-company.html', context)

@staff_required
@login_required(login_url='login')
def company_detail(request, pk):
    context = {}
    context['active_sidebar'] = 'companies'
    company_detail = User.objects.get(id = pk)
    invoices = stripe.Invoice.list(
        status='paid',
        limit=100,
        customer=company_detail.stripe_id
    )
    context['invoices'] = invoices
    context['company'] = company_detail
    seven_days_ago = timezone.now() - timedelta(days=7)
    context['company_contacts'] = Contact.objects.filter(company=company_detail.company_profile, user__last_login__gt=seven_days_ago)
    all_contacts = Contact.objects.filter(company=company_detail.company_profile)
    context['inactive_contacts'] = all_contacts.filter(Q(user__last_login__lt=seven_days_ago) | Q(user__last_login=None))
    context['is_custom_plan'] = False
    custom_plan = CustomPlan.objects.filter(user=company_detail)
    sub_plan = Subscription.objects.filter(user = company_detail)
    if custom_plan.exists():
        context['is_custom_plan'] = True
        context['company_subs_plan'] = CustomPlan.objects.get(user=company_detail)
    elif sub_plan.exists():
        context['company_subs_plan'] = Subscription.objects.get(user = company_detail)
        if context['company_subs_plan'].next_payment_date is not None :
            context['remaining_days'] = (context['company_subs_plan'].next_payment_date - timezone.now()).days
    else:
        context['company_subs_plan'] = None
    context['saved_searches'] = Searches.objects.filter(user = company_detail, search_type = Searches.Types.Saved, is_deleted = False ).order_by('-created_at')[:5]
    context['recent_searches'] = Searches.objects.filter(user = company_detail, is_deleted =False).order_by('-created_at')[:5]
    context['remaining_days'] = '--'
    context['user_id'] = pk
    return render(request, 'administration/company/company-detail.html', context)

@staff_required
@login_required(login_url='login')
def company_search_list(request, pk, type):
    context = {}
    context['active_sidebar'] = 'companies'
    context['company'] = User.objects.get(id = pk)
    if type =='Saved':
        context['show_time_result_field'] = False
        context['page_title'] = "Saved Searches"
        context['searches'] = Searches.objects.filter(user = context['company'], search_type = Searches.Types.Saved, is_deleted =False).order_by('-id')
    else:
        context['show_time_result_field'] = True
        context['page_title'] = "Recent Searches"
        context['searches'] = Searches.objects.filter(user = context['company'], is_deleted =False).order_by('-id')
    context['user_id'] = pk
    context['type'] = type
    
    paginator = Paginator(context['searches'], 20)  
    page = request.GET.get('page')  

    try:
        context['searches'] = paginator.page(page)
    except PageNotAnInteger:
        context['searches'] = paginator.page(1)
    except EmptyPage:
        context['searches'] = paginator.page(paginator.num_pages)
        
    return render(request, 'administration/company/company-search-list.html', context)

@staff_required
@login_required(login_url='login')
def company_update(request, pk):
    context = {}
    context['active_sidebar'] = 'companies'
    company_instance = User.objects.get(id=pk)
    user_instance = company_instance
    user_form = CustomUserUpdateForm(instance=user_instance)
    company_form = CompanyAddForm(instance=company_instance.company_profile)

    if request.method == 'POST':
        user_form = CustomUserUpdateForm(request.POST, instance=user_instance)
        company_form = CompanyAddForm(request.POST, instance=company_instance.company_profile)
        if user_form.is_valid() and company_form.is_valid():
            user = user_form.save()
            company = company_form.save(commit=False)
            company.user = user 
            company.save()
            messages.success(request, 'Company info successfully updated.')
            return redirect('company_detail', pk=pk)
    
    context['user_form'] = user_form
    context['form'] = company_form
    return render(request, 'administration/company/update-company.html', context)


# Invidual
@staff_required
@login_required(login_url='login')
def individuals(request):
    context = {}
    context['active_sidebar'] = 'individuals'
    individuals = User.objects.filter(role=User.Roles.USER).order_by('-id')
    paginator = Paginator(individuals, 20)  
    page = request.GET.get('page')  

    try:
        individuals = paginator.page(page)
    except PageNotAnInteger:
        individuals = paginator.page(1)
    except EmptyPage:
        individuals = paginator.page(paginator.num_pages)

    context['individuals'] = individuals
    return render(request, 'administration/individual/individuals-list.html', context)

@staff_required
@login_required(login_url='login')
def add_individual(request):
    context = {}
    context['active_sidebar'] = 'individuals'
    if request.method == 'POST':
        user_form = CustomUserCreationForm(request.POST)
        user_profile_form = UserProfileForm(request.POST)
        if user_form.is_valid() and user_profile_form.is_valid():
            user = user_form.save(commit=False)
            user.role = User.Roles.USER
            user.save()
            profile = user_profile_form.save(commit=False)
            profile.user = user
            profile.save()
            messages.success(request, 'New user successfully added.')
            return redirect('individuals')
    else:    
        user_form = CustomUserCreationForm()
        user_profile_form = UserProfileForm()
    
    context['user_form'] = user_form
    context['user_profile_form'] =user_profile_form
    return render(request, 'administration/individual/add-individual.html', context)

@staff_required
@login_required(login_url='login')
def individual_detail(request,pk):
    context = {}
    context['active_sidebar'] = 'individuals'
    individual = User.objects.get(id = pk)
    context['individual'] = individual
    invoices = stripe.Invoice.list(
        status='paid',
        limit=100,
        customer=individual.stripe_id
    )
    context['invoices'] = invoices
    context['saved_searches'] = Searches.objects.filter(user = context['individual'],search_type = Searches.Types.Saved, is_deleted = False ).order_by('-created_at')[:5]
    context['recent_searches'] = Searches.objects.filter(user = context['individual'], search_type = Searches.Types.Recent, is_deleted =False).order_by('-created_at')[:5]
    
    context['remaining_days'] = '--'
    sub_plan = Subscription.objects.filter(user = context['individual'])
    if sub_plan.exists():
        context['individual_subs_plan'] = Subscription.objects.get(user = context['individual'])
        if context['individual_subs_plan'].next_payment_date is not None:
            context['remaining_days'] = (context['individual_subs_plan'].next_payment_date - timezone.now()).days
    else:
        context['individual_subs_plan'] = None

    context['user_id'] = pk
    return render(request, 'administration/individual/individual-detail.html', context)

@staff_required
@login_required(login_url='login')
def individual_update(request,pk):
    context = {}
    context['active_sidebar'] = 'individuals'

    individual_instance = User.objects.get(id = pk)
    user_profile_instance = UserProfile.objects.get(user = individual_instance)
    user_form = CustomUserUpdateForm(instance=individual_instance)
    user_profile_form = UserProfileForm(instance = user_profile_instance)

    if request.method == 'POST':    
        user_form = CustomUserUpdateForm(request.POST, instance=individual_instance)
        user_profile_form = UserProfileForm(request.POST, instance=user_profile_instance)
        if user_form.is_valid() and user_profile_form.is_valid():
            user = user_form.save()
            profile = user_profile_form.save(commit=False)
            profile.user = user
            profile.save()
            messages.success(request, 'Individual details successfully updated.')
            return redirect('individual_detail', pk=pk)
    
    context['user_form'] = user_form
    context['user_profile_form'] =user_profile_form
    context['user_id'] = pk
    return render(request, 'administration/individual/individual-update.html', context)

@staff_required
@login_required(login_url='login')
def individual_search_list(request, pk, type):
    context = {}
    context['active_sidebar'] = 'individuals'
    context['individual'] = User.objects.get(id = pk)
    if type =='Saved':
        context['show_time_result_field'] = False
        context['page_title'] = "Saved Searches"
        context['searches'] = Searches.objects.filter(user = context['individual'], search_type = Searches.Types.Saved, is_deleted =False).order_by('-id')
    else:
        context['show_time_result_field'] = True
        context['page_title'] = "Recent Searches"
        context['searches'] = Searches.objects.filter(user = context['individual'], is_deleted =False).order_by('-id')
    context['user_id'] = pk
    context['type'] = type
    
    paginator = Paginator(context['searches'], 20)  
    page = request.GET.get('page')  

    try:
        context['searches'] = paginator.page(page)
    except PageNotAnInteger:
        context['searches'] = paginator.page(1)
    except EmptyPage:
        context['searches'] = paginator.page(paginator.num_pages)
    
    return render(request, 'administration/individual/individual-search-list.html', context)


#custom plan
@staff_required
@login_required(login_url= 'login')
def custom_plan(request):
    context = {}
    companies = Company.objects.all().values()
    context['companies_data'] = ValuesQuerySetToDict(companies)
    context['is_login'] = True
    context['active_sidebar'] = 'custom_plan'
    return render(request, 'administration/custom_plan/custom-plan.html', context)


# Subscriptions
@staff_required
@login_required(login_url='login')
def delete_subscription(request, pk):
    next = request.GET.get('next',None)
    try:
        custom_plan = CustomPlan.objects.filter(id=pk)
        subscription_instance = Subscription.objects.filter(id=pk)
        if custom_plan.exists():
            custom_plan = CustomPlan.objects.get(id=pk)
            user = custom_plan.user
            custom_plan.delete()
        elif subscription_instance.exists():
            subscription_instance = Subscription.objects.get(id=pk)
            user = subscription_instance.user
            stripe.Subscription.delete(subscription_instance.stripe_subscription_id)
            subscription_instance.delete()
        # Subscription.set_default_plan(subscription_instance)
        messages.success(request, 'Subscription plan successfully deleted.')
    except stripe.error.StripeError as e:
        print("Stripe Error:", str(e))
        messages.error(request,f'{e}')

    if next == 'individual':
        return redirect('individual_detail', pk=user.id) 
    else:
        return redirect('company_detail', pk=user.id) 