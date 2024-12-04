
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from aisearchbot.models import CandidateProfiles,DuplicateProfiles

from api.core.utils import DotsValidationError, resolve_conflicts

User = get_user_model()


class AdminLoginSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        request = self.context['request']
        try:
            validate_attrs = super().validate(attrs)
        except Exception as e:
            raise DotsValidationError({"password": [str(e)]})
        parent_or_user = self.user.get_parent_or_user
        if not parent_or_user.role == User.Roles.ASB_ADMIN:
            raise DotsValidationError({"user": ["Not a Valid Admin User."]})
        validate_attrs['user'] = AdminInfoSerializer(self.user,context={'request':request}).data
        self.user.last_login = timezone.now()
        self.user.save(update_fields=["last_login"])        
        return validate_attrs
    


class AdminProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['first_name','last_name','phone_number','email','profile_picture']

    def validate(self, attrs):
        validate_attrs = super().validate(attrs)
        user = self.context.get('user',self.instance)
        if validate_attrs.get("phone_number") and User.objects.filter(phone_number=validate_attrs["phone_number"]).exclude(id=user.id).exists():
            raise DotsValidationError({"phone": ["user with this phone number already exists."]})
        
        return validate_attrs


class AdminInfoSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = User
        fields = ['first_name','last_name','email','phone_number','role','profile_picture']


def validate_file_extension(value):
    """
    Validate that the file uploaded is either an image or a video.
    """
    valid_extensions = ['.xlsx', '.xls', '.csv']

    if not any(value.name.lower().endswith(ext) for ext in valid_extensions):
        raise DotsValidationError({"data_file": [f"Invalid file format, files allowed with these formats: {valid_extensions}"]})


class DataFileSerializer(serializers.Serializer):
    data_file = serializers.FileField(validators=[validate_file_extension], required=True)




class ProfileSerializer(serializers.ModelSerializer):
    email_perso = serializers.CharField(source='email1')
    email_pro = serializers.CharField(source='email2')
    landline = serializers.CharField(source='phone1')
    cell_phone = serializers.CharField(source='phone2')

    class Meta:
        model = CandidateProfiles
        fields = '__all__'



class ConflictSerialzer(serializers.ModelSerializer):
    original_profile = ProfileSerializer()

    class Meta:
        model = DuplicateProfiles
        fields = '__all__'



class ResolveConflictsSerializer(serializers.Serializer):
    duplicate_profile = serializers.PrimaryKeyRelatedField(queryset=DuplicateProfiles.objects.all(),required=True)
    recent = serializers.BooleanField(default=False)


    def create(self, validated_data):
        duplicate_profile = validated_data['duplicate_profile']
        recent = validated_data['recent']
        resolve_conflicts(duplicate_profile=duplicate_profile,recent=recent)
        return True