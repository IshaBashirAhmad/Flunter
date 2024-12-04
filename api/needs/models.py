from django.db import models
from api.core.models import BaseModel,CreatedByModel,CharFieldSizes
from django.contrib.postgres.fields import ArrayField
from api.asb.models import Seniorities




class ContactTypes(models.TextChoices):
    PHONE_ONLY = 'phone_only'
    EMAIL_ONLY = 'email_only'
    EMAIL_OR_PHONE = 'email_or_phone'





class Needs(BaseModel,CreatedByModel):
    name = models.CharField(max_length=CharFieldSizes.MEDIUM)
    job_title = ArrayField(models.CharField(max_length=CharFieldSizes.SMALL))
    skills = ArrayField(models.CharField(max_length=CharFieldSizes.SMALL))
    state = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    city = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    region = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    country = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    company = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    head_count = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    start_date = models.DateField()
    seniorities = ArrayField(models.CharField(max_length=1000,choices=Seniorities.choices), blank=True, null=True)
    end_date = models.DateField(blank=True,null=True)
    percentage = models.IntegerField(blank=True,null=True)
    contact = models.CharField(max_length=CharFieldSizes.MEDIUM,choices=ContactTypes.choices,blank=True,null=True)
