from django.contrib.auth import get_user_model
from django.utils.translation import gettext as _
from rest_framework import status
from rest_framework.exceptions import APIException, _get_error_details
from rest_framework.views import exception_handler
from aisearchbot.models import DuplicateProfiles
from api.actions.models import ProfileActions
from api.asb.models import ContactFields
from django.db.models import IntegerField,Func
from datetime import datetime


User = get_user_model()


def _get_error_message(detail, code):
    if isinstance(detail, dict):
        return {key: _get_error_message(value, code) for key, value in detail.items()}
    elif isinstance(detail, list):
        return [_get_error_message(item, code) for item in detail]
    elif isinstance(detail, bool): 
        return detail
    else:
        return detail 
    


class CustomDotsValidationError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = _("Invalid input.")
    default_code = "non_field"
    key = "validations"

    def __init__(self, detail=None, code=None):
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code

        if not isinstance(detail, dict) and not isinstance(detail, list):
            detail = {"non_field": [detail]}

        self.detail = _get_error_message(detail, code)


class DotsValidationError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = _("Invalid input.")
    default_code = "non_field"
    key = "validations"

    def __init__(self, detail=None, code=None):
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code

        if not isinstance(detail, dict) and not isinstance(detail, list):
            detail = {"non_field": [detail]}

        self.detail = _get_error_details(detail, code)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None and type(exc):
        if response.data.get("detail"):
            custom_response = dict(key="validations", messages={"non_field": [response.data["detail"]]})
        elif response.data.get("non_field_errors"):
            custom_response = dict(
                key="validations",
                messages={"non_field": [response.data["non_field_errors"]]},
            )
        else:
            custom_response = dict(key="validations", messages=response.data)
        response.data = custom_response
        return response

    return response




def check_credit_and_deduct(name, credits, subscription,access_log,user,profile):
    credit_error_msg = {'credits': ['Not enough credits to perform this action.']}
    credit_thresholds = {
        ContactFields.EMAIL_1: 3,
        ContactFields.EMAIL_2: 1,
        ContactFields.PHONE_1: 1,
        ContactFields.PHONE_2: 10
    }
    action = None

    required_credits = credit_thresholds.get(name, 0)
    if credits < required_credits:
        raise DotsValidationError(credit_error_msg)
    
    if not getattr(access_log,f"is_{name}",False):
        subscription.remaining_credits -= required_credits
        subscription.save(update_fields=['remaining_credits'])
        action = ProfileActions.objects.create(
            action_type=ProfileActions.Types.OPENED_PROFILE,
            created_by=user,
            profile=profile,
            comment=f"Opened {name} by {user.first_name} {user.last_name}",
            action_datetime=datetime.now()
        )
        setattr(access_log,f"is_{name}",True)
        access_log.save(update_fields=[f"is_{name}"])
    return action



class ExtractFirstYear(Func):
    function = 'SUBSTRING'
    template = (
        """CAST(SUBSTRING(%(expressions)s FROM '(?:19|20)[0-9]{2}') AS INTEGER)"""
    )
    output_field = IntegerField()






def resolve_conflicts(duplicate_profile,recent):
    original_profile = duplicate_profile.original_profile
    if recent:
        for field in DuplicateProfiles._meta.fields:
            field_name = field.name
            if field_name != "id" and field_name != "original_profile":
                setattr(original_profile, field_name, getattr(duplicate_profile, field_name))
        original_profile.save()  
    duplicate_profile.delete()