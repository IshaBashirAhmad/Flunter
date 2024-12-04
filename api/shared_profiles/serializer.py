from rest_framework import serializers
from api.core.utils import DotsValidationError
from api.shared_profiles.models import SharedProfiles
from api.asb.serializers import ShortCandidateProfileSerializer
from django.contrib.auth import get_user_model
from users.serializers import UserTeamSerializer

User = get_user_model()

class SaveSharedProfiles(serializers.ModelSerializer):
    class Meta:
        model = SharedProfiles
        fields = '__all__'

class SharedProfileSerializer(SaveSharedProfiles):
    users = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=True, many=True, write_only=True)


    def validate_users(self,users):
        current_user = self.context['request'].user
        user_team = current_user.get_team
        invalid_users = [user for user in users if user not in user_team]
        
        if invalid_users:
            raise DotsValidationError({"users": ["Please select valid users from your team."]})
        return users
    
    

    def create(self, validated_data):
        current_user = self.context['request'].user
        users = validated_data.pop('users', [])
        profile = validated_data['profile']
        new_shared_profiles = [
            SharedProfiles(shared_from=current_user, shared_to=user, profile=profile)
            for user in users
            if user != current_user and not SharedProfiles.objects.filter(shared_to=user, profile=profile, shared_from=current_user).exists()
        ]
        
        SharedProfiles.objects.bulk_create(new_shared_profiles)

        return new_shared_profiles
    


class ReturnSharedProfile(SaveSharedProfiles):
    profile = ShortCandidateProfileSerializer()
    shared_from = UserTeamSerializer()
    shared_to = UserTeamSerializer()