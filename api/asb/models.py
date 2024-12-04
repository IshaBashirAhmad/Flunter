from django.db import models
from django.contrib.auth import get_user_model
from aisearchbot.models import CandidateProfiles

User = get_user_model()




class ContactFields(models.TextChoices):
    EMAIL_1 = 'email1'
    EMAIL_2 = 'email2'
    PHONE_1 = 'phone1'
    PHONE_2 = 'phone2'


class Seniorities(models.TextChoices):
    JUNIOR = 'junior'
    MEDIOR = 'medior'
    SENIOR = 'senior'
    EXPERT = 'expert'


class ReportChoices(models.TextChoices):
    MOBILE_PHONE = 'mobile'
    LANDLINE_PHONE = 'landline'
    PERSONAL_EMAIL = 'personal_email'
    PROFESSIONAL_EMAIL = 'professional_email'
    OTHER = 'other'



class UserAccessLog(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE,related_name='access_log')
    candidate = models.ForeignKey(CandidateProfiles,on_delete=models.CASCADE,related_name='candidates')
    is_email1 = models.BooleanField(default=False)
    is_email2 = models.BooleanField(default=False)    
    is_phone1 = models.BooleanField(default=False)
    is_phone2 = models.BooleanField(default=False)




class FavoriteCandidates(models.Model):
    user = models.ForeignKey(User,on_delete=models.CASCADE,related_name='favorite_candidates')
    candidate = models.ForeignKey(CandidateProfiles,on_delete=models.CASCADE)