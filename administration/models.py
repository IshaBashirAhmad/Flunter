from django.db import models

# Create your models here.
class FlunterInfo(models.Model):
    phone_number = models.CharField(max_length=20)
    email = models.EmailField()
    postal_address = models.CharField(max_length=20)
    siret_number = models.CharField(max_length=20)