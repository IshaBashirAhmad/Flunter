from django.utils import timezone
from hmac import compare_digest
from rest_framework import serializers
from api.core.utils import DotsValidationError
from api.core.validators import PasswordValidator
from web.models import SharedUsers
from users.serializers import AuthUserInfo
from django.contrib.auth import get_user_model


User = get_user_model()



class AuthUserSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[PasswordValidator.one_symbol, PasswordValidator.lower_letter, PasswordValidator.upper_letter, PasswordValidator.number, PasswordValidator.length],
    )
    phone_number = serializers.CharField(required=False)
    class Meta:
        model = User
        fields = ['first_name','last_name','email','profile_picture','password','confirm_password','phone_number']


    @classmethod
    def _validate_password(cls, validated_data):
        password = validated_data.get("password")
        confirm_password = validated_data.pop("confirm_password")
        if not compare_digest(password, confirm_password):
            raise DotsValidationError({"password": ["Password and confirm password do not match"]})
        return password

    def create(self, validated_data):
        parent_user = self.context['user']
        validated_data['role'] = User.Roles.AUTH_USER
        password = self._validate_password(validated_data)
        user = super().create(validated_data)
        user.set_password(password)
        user.updated_at = timezone.now()
        user.last_login = timezone.now()
        user.save()
        SharedUsers.objects.create(user=user,belongs_to=parent_user)
        return user
    


class ReturnAuthUsersSerializer(serializers.ModelSerializer):
    user = AuthUserInfo()
    class Meta:
        model = SharedUsers
        fields = ['user']



class AuthUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name','last_name','email','profile_picture']