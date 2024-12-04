from django.db import models

# Create your models here.




class Plans(models.TextChoices):
    MONTHLY = 'monthly'
    YEARLY = 'yearly'