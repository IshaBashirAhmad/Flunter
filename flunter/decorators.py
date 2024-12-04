from django.shortcuts import redirect
from functools import wraps
from flunter.helpers import get_access_token_from_api, get_expiry_time_from_access_token, get_user_detail


def staff_required(func):
    @wraps(func)
    def wrap(request, *args, **kwargs):
        if request.user.is_staff:
            return func(request, *args, **kwargs)
        else:
            return redirect('login')
    return wrap


def admin_exclusion(function):
    def wrap(request, *args, **kwargs):
        if request.user.is_staff or request.user.is_superuser:
            return redirect('/administration/')
        else:
            return function(request, *args, **kwargs)
    return wrap

def super_admin_required(function):
    def wrap(request, *args, **kwargs):
        if not request.user.is_superadmin:
            return redirect('/aisearchbot/login')
        else:
            return function(request, *args, **kwargs)
    return wrap

def redirect_if_logged_in(func):
    @wraps(func)
    def wrap(request, *args, **kwargs):
        if request.user.is_authenticated and request.user.role =='admin':
            return redirect('/administration/') 
        elif request.user.is_authenticated and not request.user.role =='admin': 
            return redirect('/')
        return func(request, *args, **kwargs)
    return wrap


def user_signin_required(function):
    def wrap(request, *args, **kwargs):
        request.temp_cookie = request.COOKIES.get('user_access')
        if 'user_access' not in request.COOKIES and 'user_refresh' not in request.COOKIES:
            return redirect('/login/')
        # Check if the access token is present in the cookies
        elif 'user_access' not in request.COOKIES:
            access_token = get_access_token_from_api(request)
            expiry_time = get_expiry_time_from_access_token(access_token)

            user_data = get_user_detail(request, access_token)
            request.user_data = user_data
            request.temp_cookie = access_token

            response = function(request, *args, **kwargs)
            response.set_cookie('user_access', access_token, expires=expiry_time)
            return response
        else:
            user_data = get_user_detail(request)
            request.user_data = user_data
        return function(request, *args, **kwargs)
    return wrap