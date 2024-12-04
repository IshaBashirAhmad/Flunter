from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField
from api.core.models import BaseModel
from api.asb.models import ContactFields,Seniorities



User = get_user_model()





class Searches(BaseModel):
    class Types(models.TextChoices):
        Recent = 'recent', ('Recent')
        Saved = 'saved', ('Saved')
    
    class SearchViaOperations(models.TextChoices):
        OR = 'or', ('or')
        AND = 'and', ('and')
        
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='searches',blank=True)
    keywords = models.TextField(null=True, blank=True)
    state = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    city = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    region = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    country = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    search_via = ArrayField(models.CharField(max_length=100,choices=ContactFields.choices), null=True, blank=True)
    job_title = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    skills = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    companies = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    head_count = ArrayField(models.CharField(max_length=1000), blank=True, null=True)
    search_via_op = models.CharField(max_length=25, default=SearchViaOperations.OR.value, choices=SearchViaOperations.choices)
    contact_name = models.CharField(max_length=255, null=True, blank=True)
    number_of_results = models.PositiveIntegerField(null=True, blank=True)
    seniority = ArrayField(models.CharField(max_length=1000, choices=Seniorities.choices), blank=True, null=True)
    is_deleted = models.BooleanField(default=False)
    
    search_type = models.CharField(max_length=25, default=Types.Recent.value, choices=Types.choices)