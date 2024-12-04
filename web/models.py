import os
from django.db import models
from django.conf import settings
from users.models import User
from django.dispatch import receiver


class SharedUsers(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='shared_user_profile')
    belongs_to = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True,related_name='auth_users')

    class Meta:
        managed = True

class Searches(models.Model):
    class Types(models.TextChoices):
        Recent = 'recent', ('Recent')
        Saved = 'saved', ('Saved')
    
    class SearchViaOperations(models.TextChoices):
        OR = 'or', ('or')
        AND = 'and', ('and')
        
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_searches')
    keywords = models.TextField(null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    search_via = models.CharField(max_length=255, null=True, blank=True)
    job_title = models.TextField(null=True, blank=True)
    skills = models.TextField(null=True, blank=True)
    companies = models.TextField(null=True, blank=True)
    head_count = models.TextField(null=True, blank=True)
    search_via_op = models.CharField(max_length=25, default=SearchViaOperations.OR.value, choices=SearchViaOperations.choices)
    contact_name = models.CharField(max_length=255, null=True, blank=True)
    seniority_levels = models.CharField(max_length=128, null=True, blank=True)
    number_of_results = models.PositiveIntegerField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    
    search_type = models.CharField(max_length=25, default=Types.Recent.value, choices=Types.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)