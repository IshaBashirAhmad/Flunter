import random
import string

from django.db import models


class DeviceType(models.TextChoices):
    WEB = "web"
    MOBILE = "mobile"


class Status(models.TextChoices):
    ACCEPTED = "accepted"
    DECLINED = "declined"
    PENDING = "pending"


ALL_CITIES = "All"
