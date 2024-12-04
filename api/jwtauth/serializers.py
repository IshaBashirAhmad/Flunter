from hmac import compare_digest

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from rest_framework.validators import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from api.user_connections.models import UserTokens
from users.serializers import (
    UserProfileSerializer,
    CompanyProfileInfoSerializer,
    AuthUserInfo
)


from api.core.otp_helper import email_send
from api.core.utils import DotsValidationError,CustomDotsValidationError
from api.core.validators import PasswordValidator, validate_siret_number
from datetime import timedelta

User = get_user_model()
from users.models import Company, UserProfile,OTP
from api.core.res_messages import ResponseMessage
from flunter.helpers import get_otp_verified_token,otp_number




class OTPSerializer(serializers.Serializer):
    email = serializers.EmailField(write_only=True)
    otp_type = serializers.ChoiceField(choices=['forgot'], write_only=True)

    def validate(self, attrs):
        email = attrs["email"]
        otp_type = attrs["otp_type"]
        user = User.objects.filter(email=email)
        if not user.exists():
            raise DotsValidationError({"email": "This email is not registered"})
        timeout = timezone.now() + timedelta(seconds=300)
        code = otp_number()
        verification_token = get_otp_verified_token(email=email, secret_key=code)
        new_otp = OTP.objects.create(code=code, email=email, type=otp_type, timeout=timeout,verification_token=verification_token)
        email_send(code=new_otp.code,email=new_otp.email) 
        return attrs


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(write_only=True)
    otp_type = serializers.ChoiceField(choices=['forgot'], write_only=True)
    otp_code = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"]
        otp_code = attrs["otp_code"]
        otp_type = attrs["otp_type"]

        user_otp = OTP.objects.filter(email=email, type=otp_type).order_by("-pk").first()
        if not user_otp:
            raise DotsValidationError({"email": "This email is not registered"})

        if str(user_otp.code) != otp_code:
            raise DotsValidationError({"otp_code": str(ResponseMessage.wrong_otp_code.message)})

        if user_otp.used:
            raise DotsValidationError({"otp_code": str(ResponseMessage.otp_already_used.message)})

        if timezone.now() > user_otp.timeout:
            raise DotsValidationError({"otp_code": str(ResponseMessage.otp_expired.message)})
        user_otp.used = True
        user_otp.timeout = timezone.now() + timedelta(seconds=300)

        user_otp.save()
        return attrs


class UserAuthProfile(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = "__all__"


class CompanyProfile(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = "__all__"


class UserCreateSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[PasswordValidator.one_symbol, PasswordValidator.lower_letter, PasswordValidator.upper_letter, PasswordValidator.number, PasswordValidator.length],
    )
    gender = serializers.ChoiceField(choices=UserProfile.Genders.choices, required=False)
    company_name = serializers.CharField(required=False)
    company_siret_number = serializers.CharField(required=False,validators=[validate_siret_number])
    company_address = serializers.CharField(required=False)
    designation = serializers.CharField(required=False)
    client_type = serializers.ChoiceField(choices=['important','growing','do not contact anymore'],required=True)
    country = serializers.CharField(required=False)
    role = serializers.ChoiceField(choices=User.Roles.choices)

    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "email",
            "phone_number",
            "gender",
            "password",
            "confirm_password",
            "role",
            "company_name",
            "company_siret_number",
            "company_address",
            "designation",
            "client_type",
            "country",
        )

    def validate(self, attrs):
        validate_attrs = super(UserCreateSerializer, self).validate(attrs)
        if validate_attrs.get("phone_number") and User.objects.filter(phone_number=validate_attrs["phone_number"]).exists():
            raise ValidationError({"phone": ["user with this phone number already exists."]})
        return validate_attrs

    @classmethod
    def _validate_password(cls, validated_data):
        password = validated_data.get("password")
        confirm_password = validated_data.pop("confirm_password")
        if not compare_digest(password, confirm_password):
            raise serializers.ValidationError({"password": ("Password and confirm password do not match")})
        return password

    def create(self, validated_data):
        company_name = validated_data.pop("company_name", "")
        company_siret_number = validated_data.pop("company_siret_number", "")
        company_address = validated_data.pop("company_address", "")
        designation = validated_data.pop("designation", "")
        client_type = validated_data.pop("client_type", "")
        gender = validated_data.pop("gender", "")
        country = validated_data.pop("country", "")
        password = self._validate_password(validated_data)
        if validated_data.get("role") == User.Roles.COMPANY:
            if not all([company_name, company_siret_number, company_address, designation]):
                raise DotsValidationError({"user": ["These fields are required with given role: ['company_name','company_siret_number','company_address','designation']"]})
            user = super(UserCreateSerializer, self).create(validated_data)
            data = {
                "user": user.id,
                "company_name": company_name,
                "company_siret_number": company_siret_number,
                "company_address": company_address,
                "designation": designation,
                "client_type": client_type,
            }
            user_profile = CompanyProfile(data=data)
        elif validated_data.get("role") == User.Roles.USER:
            if not all([country, gender]):
                raise DotsValidationError({"user": ["These fields are required with given role: ['country','gender']"]})
            user = super(UserCreateSerializer, self).create(validated_data)
            data = {
                "user": user.id,
                "client_type": client_type,
                "gender": gender,
                "country": country,
            }
            user_profile = UserAuthProfile(data=data)
        user_profile.is_valid(raise_exception=True)
        user_profile.save()
        user.set_password(password)
        user.updated_at = timezone.now()
        user.last_login = timezone.now()
        user.save()
        return user


class BaseLoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        request = self.context['request']
        try:
            validate_attrs = super().validate(attrs)
        except Exception as e:
            raise DotsValidationError({"password": [str(e)]})
        parent = self.user.get_parent_or_user
        if not parent.role in [User.Roles.USER,User.Roles.COMPANY]:
            raise DotsValidationError({"user": ["Not a Valid App User."]})
        if self.user.can_login:
            UserTokens.objects.create(user=self.user,refresh_token=validate_attrs['refresh'])
        else:
            raise CustomDotsValidationError(detail={"user":['The number of simultaneous connections already reached. Please log out from there and then try to log in here.'],"connection_limit":True})
        self.user.last_login = timezone.now()
        if self.user.role == User.Roles.USER:
            user_profile = UserProfileSerializer(self.user.user_profile,context={'request':request})
        elif self.user.role == User.Roles.COMPANY:
            user_profile = CompanyProfileInfoSerializer(self.user.company_profile,context={'request':request})
        else:
            user_profile = AuthUserInfo(self.user,context={'request':request})
        self.user.save(update_fields=["last_login"])        
        validate_attrs['user_profile'] = user_profile.data
        return validate_attrs
    
    

class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate(self, attrs):
        self.token = attrs["refresh"]
        return attrs

    def save(self, **kwargs):
        user = self.context['user']
        try:
            RefreshToken(self.token).blacklist()
            UserTokens.objects.filter(user=user,refresh_token=self.token).delete()
        except TokenError:
            raise DotsValidationError({"token": "Invalid token !"})

            

class UpdatePassword(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=
        [
            PasswordValidator.one_symbol, 
            PasswordValidator.lower_letter, 
            PasswordValidator.upper_letter, 
            PasswordValidator.number,
            PasswordValidator.length
        ],
    )
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        user = self.context["request"].user
        password = data.get("password")
        confirm_password = data.get("confirm_password")
        if not user.check_password(data.get("old_password")):
            raise serializers.ValidationError({"old_password": "Incorrect old password."})
        if not compare_digest(password, confirm_password):
            raise serializers.ValidationError({"password": ("Password and confirm password do not match")})
        user.set_password(password)
        user.save()
        return data
    

class PasswordResetSerializer(serializers.Serializer):
    verification_token = serializers.CharField(required=True, write_only=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[PasswordValidator.one_symbol, PasswordValidator.lower_letter, PasswordValidator.upper_letter, PasswordValidator.number,PasswordValidator.length],
    )
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        password = data.get("password")
        confirm_password = data.get("confirm_password")

        if not compare_digest(password, confirm_password):
            raise serializers.ValidationError({"password": ("Password and confirm password do not match")})

        return data