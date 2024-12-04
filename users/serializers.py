from django.forms import ValidationError
from rest_framework import serializers
from django.contrib.auth import get_user_model
from api.core.validators import validate_siret_number
from users.models import Company,UserProfile,Subscription
from api.subscriptions.serializers import ShortSubscriptionPlanSerializer

User = get_user_model()




def get_sub_data(obj):
    parent_or_user =  obj.get_parent_or_user
    sub = parent_or_user.get_subscription
    data = None
    if sub:
        data = ShortSubscriptionPlanSerializer(sub.plan).data
        data['id'] = sub.plan.id
        data['name'] = f"{sub.plan.name} {sub.subscription_interval.capitalize()}"
        data['used_credits'] = sub.plan.credits - sub.remaining_credits
        data['current_plan'] = sub.subscription_interval.capitalize()
        data['is_trial_user'] = sub.is_trial
        data['next_payment'] = sub.next_payment_date
        data['price'] = sub.plan.monthly_price if sub.subscription_interval == Subscription.Interval.MONTHLY else sub.plan.yearly_price
        if sub.is_trial:
            parent = obj.get_parent_or_user
            data['remaining_trial_days'] = parent.get_trial_days
    return data



class UserInfoSerializer(serializers.ModelSerializer):
    sub = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    auth_users = serializers.SerializerMethodField()
    has_subscribed = serializers.SerializerMethodField(method_name='is_sub')

    class Meta:
        model = User
        fields = ['id','first_name','last_name','phone_number','profile_picture','role','email','has_used_trial','sub','auth_users','has_subscribed']


    def get_sub(self,obj):
        return get_sub_data(obj=obj)

    def get_profile_picture(self, obj):
        request = self.context.get("request")
        return request.build_absolute_uri(obj.profile_picture.url)
    
    def get_auth_users(self,obj):
        return obj.auth_count
    
    def is_sub(self,obj):
        return obj.has_subscribed


    def update(self, instance, validated_data):
        validated_data['profile_picture'] = instance.profile_picture
        validated_data['role'] = instance.role
        validated_data['has_used_trial'] = instance.has_used_trial
        return super().update(instance, validated_data)
    
    def validate(self, attrs):
        validate_attrs = super(UserInfoSerializer, self).validate(attrs)
        user = self.context.get('user',self.instance) # to handle both creation and updation.
        if validate_attrs.get("phone_number") and User.objects.filter(phone_number=validate_attrs["phone_number"]).exclude(id=user.id).exists():
            raise ValidationError({"phone": ["user with this phone number already exists."]})
        return validate_attrs


class AuthUserInfo(serializers.ModelSerializer):
    sub = serializers.SerializerMethodField()
    auth_users = serializers.SerializerMethodField()
    has_subscribed = serializers.SerializerMethodField(method_name='is_sub')

    class Meta:
        model = User
        fields = ['id','first_name','last_name','profile_picture','role','email','sub','auth_users','has_subscribed','is_active']

    def update(self, instance, validated_data):
        validated_data['role'] = instance.role
        return super().update(instance, validated_data)

    def get_sub(self,obj):
        return get_sub_data(obj=obj)
    
    def get_auth_users(self,obj):
        return obj.auth_count
    

    def is_sub(self,obj):
        parent_or_user =  obj.get_parent_or_user
        return parent_or_user.has_subscribed


class CompanyProfileInfoSerializer(serializers.ModelSerializer):
    user = UserInfoSerializer()
    company_siret_number = serializers.CharField(required=False,validators=[validate_siret_number])

    

    class Meta:
        model = Company
        fields = '__all__' 


    def update(self, instance, validated_data):
        user_data = validated_data.pop('user')
        user_serializer = UserInfoSerializer(data=user_data,partial=True,instance=instance.user)
        user_serializer.is_valid(raise_exception=True)
        user_serializer.save()
        return super().update(instance, validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    user = UserInfoSerializer()


    class Meta:
        model = UserProfile
        fields = '__all__'

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user')
        user_serializer = UserInfoSerializer(data=user_data,partial=True,instance=instance.user)
        user_serializer.is_valid(raise_exception=True)
        user_serializer.save()
        return super().update(instance, validated_data)
    

class UserProfileImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['profile_picture']



class UserTeamSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = User
        fields = ['id','first_name','last_name']

        