import re

from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework import serializers


class PasswordValidator(object):
    @staticmethod
    def one_symbol(value):
        if not set("[.?~!@#$%^&*()_+{}\":-;']+$").intersection(value):
            raise serializers.ValidationError("Password should have at least one symbol")
        return value

    @staticmethod
    def lower_letter(value):
        if not any(char.islower() for char in value):
            raise serializers.ValidationError("Password should have at least one lowercase letter")

        return value

    @staticmethod
    def upper_letter(value):
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError("Password should have at least one uppercase letter")
        return value

    @staticmethod
    def number(value):
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password should have at least one numeral")
        return value

    @staticmethod
    def length(value):
        if len(value) < 8:
            raise serializers.ValidationError("This password is too short. It must contain at least 8 characters.")


def validate_range(value):
    if len(value) < 2:
        raise serializers.ValidationError("Salary: From and To range both are required")

    if value[0] > value[1]:
        raise serializers.ValidationError("Salary: From should be lower than To")


def validate_length(text):
    text = re.sub(r"\s+", "", text)
    if len(text) > 75:
        raise serializers.ValidationError("Max len is 75")



def validate_siret_number(value):
    if not value.isdigit() or len(value) != 14:
        raise ValidationError("SIRET number must contain exactly 14 digits.")