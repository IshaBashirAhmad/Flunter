import base64
import jwt
import requests
from django.utils import timezone
from datetime import timedelta, datetime
from random import randint
from django.template.loader import get_template
from django.template import Context
from users.models import OTP, User
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.shortcuts import redirect


def otp_number():
    return str(randint(100000, 999999))


def get_otp_verified_token(email, secret_key):
    token_str = otp_number() + secret_key + 'email=' + email
    token_str_bytes = token_str.encode('ascii')
    base64_bytes = base64.b64encode(token_str_bytes)
    base64_message = base64_bytes.decode('ascii')
    return base64_message


def decrypt_token(token):
    token_str_bytes = token.encode('ascii')
    base64_bytes = base64.b64decode(token_str_bytes)
    base64_message = base64_bytes.decode('ascii')
    code, email = base64_message.split('email=')
    return code, email


def send_verification_code_email(email: str):
    secret_key = otp_number()
    verification_token = get_otp_verified_token(email=email, secret_key=secret_key)
    update_fields = {'verification_token': f'{verification_token}', 'code': f'{secret_key}', 'timeout': timezone.now() + timedelta(hours=1), 'used': False}
    update_code = OTP.objects.update_or_create(email=email, defaults=update_fields)
    if update_code:
        try:
            email_subject = 'Flunter Verification Code.'
            text_content = email_subject
            text_template = get_template('email_templates/verify-code-email.html')
            context_obj = { 'verification_code': secret_key }
            template_content = text_template.render(context_obj)
            msg = EmailMultiAlternatives(email_subject, text_content, settings.EMAIL_HOST_USER, [email])
            msg.attach_alternative(template_content, 'text/html')
            msg.send()
            return verification_token
        except Exception as e:
            print(e)
            return False
            


def queryDict_to_dict(qdict):
    return {k: v[0] if len(v) == 1 else v for k, v in qdict.lists()}


def ValuesQuerySetToDict(vqs):
    return [item for item in vqs]


def send_account_credentials_email(email: str, password: str, url: str):
    link= url
    if email and password:
        try:
            email_subject = 'Flunter Account Credentials.'
            text_content = email_subject
            text_template = get_template('email_templates/account-credentials-email.html')
            context_obj = { 'link': link, 'email': email, 'password': password  }
            template_content = text_template.render(context_obj)
            msg = EmailMultiAlternatives(email_subject, text_content, settings.EMAIL_HOST_USER, [email])
            msg.attach_alternative(template_content, 'text/html')
            msg.send()
            return True
        except Exception as e:
            print(e)
            return False
        

def send_get_in_touch_email(data):
    try:
        email_subject = 'Flunter Get In Touch'
        text_content = email_subject
        text_template = get_template('email_templates/get-in-touch-email.html')
        context_obj = { 'first_name': data.get('first_name', ''), 'last_name': data.get('last_name', ''), 'topic': data.get('topic', ''), 'email': data.get('email', ''), 'description': data.get('description', '') }
        template_content = text_template.render(context_obj)
        msg = EmailMultiAlternatives(email_subject, text_content, settings.EMAIL_HOST_USER, [settings.CONTACT_EMAIL_RECEIVER])
        msg.attach_alternative(template_content, 'text/html')
        msg.send()
        return True
    except Exception as e:
        print(e)
        return False
    

def forward_contact_us_email(data):
    try:
        email_subject = 'Flunter Contact Us'
        text_content = email_subject
        text_template = get_template('email_templates/contact-us-email.html')
        context_obj = { 'contact_name': data.get('contact_name', ''), 'contact_email': data.get('contact_email', ''), 'contact_phone': data.get('contact_phone', ''), 'business_name': data.get('business_name', ''), 'business_email': data.get('business_email', ''), 'number_of_employees': data.get('number_of_employees', ''), 'desired_credits': data.get('desired_credits', ''), 'desired_connections': data.get('desired_connections', ''), 'comment': data.get('comment', '') }
        template_content = text_template.render(context_obj)
        msg = EmailMultiAlternatives(email_subject, text_content, settings.EMAIL_HOST_USER, [settings.CONTACT_EMAIL_RECEIVER])
        msg.attach_alternative(template_content, 'text/html')
        msg.send()
        return True
    except Exception as e:
        print(e)
        return False
    
def forward_opt_out_request(data):
    try:
        email_subject = 'Flunter Opt-Out Request'
        text_content = email_subject
        text_template = get_template('email_templates/opt-out-email.html')
        context_obj = { 'full_name': data.get('full_name', ''), 'email': data.get('email', ''), 'contact_phone': data.get('contact_phone', ''), 'country': data.get('country', ''), 'additional_information': data.get('additional_information', '') }
        template_content = text_template.render(context_obj)
        msg = EmailMultiAlternatives(email_subject, text_content, settings.EMAIL_HOST_USER, [settings.CONTACT_EMAIL_RECEIVER])
        msg.attach_alternative(template_content, 'text/html')
        msg.send()
        return True
    except Exception as e:
        print(e)
        return False
    

def send_report_candidate_email(data):
    try:
        email_subject = f'Candidate Report Submission - {data["current_user_name"]}'
        text_content = email_subject
        text_template = get_template('email_templates/report-candidate-email.html')
        # context_obj = { 'contact_name': data.get('contact_name', ''), 'contact_email': data.get('contact_email', ''), 'contact_phone': data.get('contact_phone', ''), 'business_name': data.get('business_name', ''), 'business_email': data.get('business_email', ''), 'number_of_employees': data.get('number_of_employees', ''), 'desired_credits': data.get('desired_credits', ''), 'desired_connections': data.get('desired_connections', ''), 'comment': data.get('comment', '') }
        template_content = text_template.render(data)
        msg = EmailMultiAlternatives(email_subject, text_content, settings.EMAIL_HOST_USER, [settings.CONTACT_EMAIL_RECEIVER])
        msg.attach_alternative(template_content, 'text/html')
        msg.send()
        return True
    except Exception as e:
        print(e)
        return False


def requestAPI(method:str, url:str, headers:dict, data:dict):
    status = 400
    try:
        response = requests.request(method, url, headers=headers, data=data, verify=False)
        return response.status_code, response.json()
    except Exception as e:
        return status, str(e)
    

def get_access_token_from_api(request):
    refresh_response = requests.post(f'{settings.API_URL}/auth/token/refresh/', json={"refresh": request.COOKIES.get('user_refresh')})
    if refresh_response.status_code == 200:
        access_token = refresh_response.json().get('access')
        return access_token
    return redirect('/login/')
    

def get_expiry_time_from_access_token(token):
    decoded = jwt.decode(jwt=token, algorithms=["HS256"], options={"verify_signature": False})
    date = datetime.utcfromtimestamp(decoded['exp'])
    return date


def get_user_detail(request, token=None):
    user_access_token = request.COOKIES.get('user_access', token)
    headers = {"Authorization": f"Bearer {user_access_token}"}
    user_response = requests.get(f'{settings.API_URL}/me/', headers=headers)
    user_response = user_response.json()
    if 'data' not in user_response.keys():
        custom_response = {}
        custom_response['data'] = user_response
        return custom_response
    return user_response