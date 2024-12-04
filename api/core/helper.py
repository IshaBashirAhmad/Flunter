import json
import os
import time
import uuid
from datetime import date, timedelta, timezone

from django.conf import settings
from django.core.mail import send_mail
from django.http.response import JsonResponse
from django.template.loader import render_to_string
from rest_framework import status

SUCCESS_CODE = 1


def get_file_path(instance, filename):
    ext = filename.split(".")[-1]
    filename = "%s.%s" % (uuid.uuid4(), ext)
    # return os.path.join(settings.MEDIA_URL, filename)
    return filename


def SuccessResponse(data):
    return JsonResult(SUCCESS_CODE, data, status.HTTP_200_OK)


def ErrorResponse(custom_obj, body=None):
    if body is None:
        return JsonResult(custom_obj.code, custom_obj.message, custom_obj.http_code)
    return JsonResult(custom_obj.code, body, custom_obj.http_code)


def JsonResult(success_code, data, http_status_code):
    if success_code is not None and success_code != SUCCESS_CODE:
        return JsonResponse(data={"success": success_code, "errors": data}, status=http_status_code)
    else:
        if isinstance(data, str):
            return JsonResponse(data={"success": success_code, "message": data}, status=http_status_code)
        else:
            return JsonResponse(data={"success": success_code, "data": data}, status=http_status_code)


def document_to_dict(documents, fields):
    response = []
    for value in documents.execute().to_dict().get("hits", {}).get("hits", {}):
        value_to_push = {}

        for field in fields:
            if type(field) is dict:
                for key, label in field.items():
                    custom_value = {}

                    for item in label:
                        custom_value.update({field: value["_source"][field][item]})

                    value_to_push.update({key: custom_value})
            else:
                value_to_push.update({field: value["_source"][field]})

        response.append(value_to_push)

    return response


def filter_queryset_by_fields(queryset, fields, data):
    for data_field, field in fields.items():
        if data.get(data_field):
            queryset = queryset.filter(**{field: data[data_field].split(",")})
    return queryset


def date_range(start_date, end_date):
    for n in range(int((end_date - start_date).days)):
        yield start_date + timedelta(n)


def get_json_dump(dictionary):
    return json.dumps(dictionary, indent=4)


def get_stringify_dict(dictionary):
    return json.loads(json.dumps(dictionary), parse_int=str)


def is_valid_str(token):
    if token is not None and token.strip() != "":
        return True
    return False


def pop_key(dictionary, key):
    try:
        return dictionary.pop(key)
    except KeyError:
        return None


def last_day_in_prev_month(dt: timezone) -> timezone:
    return dt.replace(day=1) - timedelta(days=1)


def remove_duplicates(l):
    return list(dict.fromkeys(l))


def to_lower_underscore_to_blank(text: str) -> str:
    return text.lower().replace("_", " ")
