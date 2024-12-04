from datetime import date

from rest_framework import serializers
from django.core.validators import MinValueValidator, MaxValueValidator
from api.core.utils import DotsValidationError

from api.payments.Stripe import Stripe


class StripePublishableKeySerializer(serializers.Serializer):
    stripe_publishable_key = serializers.CharField()


class StripeCardRequestSerializer(serializers.Serializer):
    source_id = serializers.CharField()


class StripeCardCreateRequestSerializer(serializers.Serializer):
    source_token = serializers.CharField()
    stripe_id = serializers.CharField(required=False)

    def create(self, validated_data):
        source_token = validated_data.get('source_token')
        stripe_id = validated_data.get('stripe_id')

        success, added_source = Stripe.add_source(stripe_id, source_token)
        if not success:
            raise DotsValidationError(added_source)       # added_resource will contain error
        return added_source


class ReturnStripeCardSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    last4 = serializers.CharField()
    exp_month = serializers.IntegerField()
    exp_year = serializers.IntegerField()
    brand = serializers.CharField()


class StripeCardUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)
    exp_month = serializers.IntegerField(required=False, validators=[MinValueValidator(1), MaxValueValidator(12)])
    exp_year = serializers.IntegerField(required=False, validators=[MinValueValidator(date.today().year)])

    def update(self, instance, validated_data):
        card_id = instance.get('id')
        stripe_id = instance.get('customer')
    
        success, updated_source = Stripe.update_card(stripe_id, card_id, validated_data)
        if not success:
            raise DotsValidationError(updated_source)       # added_resource will contain error

        return updated_source
