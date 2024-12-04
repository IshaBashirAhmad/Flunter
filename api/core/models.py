from django.db import models
from django.utils.translation import gettext as _
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class CreatedByModel(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        abstract = True


class CreatedAtModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class UpdatedAtModel(models.Model):
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class BaseModel(CreatedAtModel, UpdatedAtModel):
    class Meta:
        abstract = True


class CustomFieldMixin(models.Model):
    custom_fields = models.JSONField(default=dict)

    class Meta:
        abstract = True


class DecimalSize:
    def __init__(self, decimal_place, max_digits) -> None:
        self.DECIMAL_PLACES = decimal_place
        self.MAX_DIGITS = max_digits


class DecimalSizes:
    Price = DecimalSize(2, 12)
    Measurements = DecimalSize(2, 12)


class CharFieldSizes:
    EXTRA_SMALL = 10
    SMALL = 50
    MEDIUM = 100
    LARGE = 150
    X_Large = 200
    XX_LARGE = 250
    XXX_LARGE = 500
    MAX = 5000


class LengthUnits(models.TextChoices):
    INCHES = "in", _("Inches")
    CENTIMETERS = "cm", _("Centimeters")
    FEET = "ft", _("Feet")
    METERS = "m", _("Meters")


class WeightUnits(models.TextChoices):
    POUNDS = "lb", _("Pounds")
    KILOGRAMS = "kg", _("Kilograms")
    OUNCES = "oz", _("Ounces")
    GRAMS = "g", _("Grams")


class MediaTypes:
    JSON = "application/json"
    FORM = "multipart/form-data"
    FORM_URL_ENCODED = "application/x-www-form-urlencoded"


class CustomResponse:
    def __init__(self, code, message, http_code) -> None:
        self.code = code
        self.message = message
        self.http_code = http_code


class GlobalResponseMessages:
    un_authenticated = CustomResponse(4001, "Invalid Credentials!", status.HTTP_401_UNAUTHORIZED)
    missing_params = CustomResponse(4002, "Missing required information!", status.HTTP_400_BAD_REQUEST)
    serializer_error = CustomResponse(4004, "Serializer Error", status.HTTP_400_BAD_REQUEST)
    record_not_found = CustomResponse(4004, "Record not found!", status.HTTP_404_NOT_FOUND)
    something_went_wrong = CustomResponse(5001, "Something went wrong!", status.HTTP_503_SERVICE_UNAVAILABLE)



class PercentageChoices(models.TextChoices):
    GREATER_THAN_90 = '90'
    GREATER_THAN_80 = '80'
    GREATER_THAN_60 = '60'
    ALL = '0'