from rest_framework import serializers
from users.models import SubscriptionPlans
from api.subscriptions.models import Plans
from api.payments.Stripe import Stripe





class SubscriptionPlansSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlans
        fields = [
                "id",
                "name",
                "monthly_price",
                "yearly_price",
                "users_limit",
                "simultaneous_connections_limit",
                "credits"
            ]

class CreateSubscriptionSerializer(serializers.Serializer):
    subscription = serializers.PrimaryKeyRelatedField(queryset=SubscriptionPlans.objects.all())
    frequency = serializers.ChoiceField(choices=Plans.choices)




class PaymentMethodSaveSerializer(serializers.Serializer):
    payment_id = serializers.CharField()

    def save_payment(self,clean_data):
        user = self.context['user']
        payment_id = clean_data['payment_id']
        old_payment_method_id = user.payment_method_id
        customer = user.stripe_id
        Stripe.create_payment_method(payment_method_id=payment_id,customer=customer)
        response = Stripe.default_payment_method(customer_id=customer,payment_method_id=payment_id)
        if response[0] == True:
            user.payment_method_id = response[1]['invoice_settings']['default_payment_method']
            user.save(update_fields=['payment_method_id'])
            if old_payment_method_id:
                Stripe.remove_payment_method(payment_method_id=old_payment_method_id)
        return user



class ShortSubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlans
        fields = ['name','users_limit','simultaneous_connections_limit','credits']