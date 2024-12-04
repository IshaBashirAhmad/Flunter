import base64
from enum import Enum
import base64
from random import randint
from django.template.loader import get_template
from django.utils import timezone
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from random import randint

from api.core.utils import DotsValidationError
from users.models import OTP


class OTPtypes(Enum):
    CREATE_USER = "create"
    FORGOT_PASSWORD = "forgot"

    @staticmethod
    def get_enum_set():
        return set(item.value for item in OTPtypes)

    @staticmethod
    def choices():
        return [(item.value, item.value) for item in OTPtypes]


def get_random_otp():
    return str(randint(1000, 9999))


def get_otp_verified_token(otp, content):
    token_str = get_random_otp() + content + otp
    token_str_bytes = token_str.encode("ascii")
    base64_bytes = base64.b64encode(token_str_bytes)
    base64_message = base64_bytes.decode("ascii")
    return base64_message




def email_send(code,email):
    email_subject = 'Flunter Verification Code.'
    text_content = email_subject
    text_template = get_template('email_templates/verify-code-email.html')
    context_obj = { 'verification_code': code }
    template_content = text_template.render(context_obj)
    msg = EmailMultiAlternatives(email_subject, text_content, settings.EMAIL_HOST_USER, [email])
    msg.attach_alternative(template_content, 'text/html')
    msg.send()



def verify_otp(token, email, otp_type):
    """returns user otp and error response if found any"""
    try:
        user_otp = OTP.objects.get(verification_token=token, email=email, type=otp_type)
        if timezone.now() > user_otp.timeout:
            raise DotsValidationError("Token Expired !")
    except OTP.DoesNotExist:
        raise DotsValidationError("Generate OTP First !")
    return user_otp