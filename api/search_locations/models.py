from django.db import models
from django.contrib.postgres.fields import ArrayField








class SearchLocation(models.Model):
    cities = ArrayField(models.CharField(max_length=100))
    states = ArrayField(models.CharField(max_length=100))
    regions = ArrayField(models.CharField(max_length=100))
    countries = ArrayField(models.CharField(max_length=100))
