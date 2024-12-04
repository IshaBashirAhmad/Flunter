from rest_framework import serializers
from aisearchbot.models import CandidateProfiles
from api.core.utils import DotsValidationError
from api.my_lists.models import ProfileLists,SavedProfilesLists
from users.serializers import UserTeamSerializer
from api.asb.serializers import CandidateProfileSerializer


class ProfileListSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = ProfileLists
        fields = '__all__'

    def _check_duplicate_list(self, user, name, list_type):
        if self.Meta.model.objects.filter(created_by=user, name=name, list_type=list_type).exists():
            raise DotsValidationError({"user_list": ['List with this name and type already exists.']})

    def create(self, validated_data):
        user = self.context['request'].user
        self._check_duplicate_list(user, validated_data['name'], validated_data.get('list_type',ProfileLists.Types.RECRUITMENT.value))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        user = self.context['request'].user
        name = validated_data.get('name', instance.name)
        list_type = validated_data.get('list_type', instance.list_type)
        if not instance.name == name:
            self._check_duplicate_list(user, name, list_type)
        return super().update(instance, validated_data)


class ReturnProfileListSerializer(ProfileListSerializer):
    created_by = UserTeamSerializer()
    results = serializers.SerializerMethodField()



    def get_results(self,obj):
        return obj.profile_lists.all().count()


class SaveProfilesListsSerializers(serializers.ModelSerializer):

    class Meta:
        model = SavedProfilesLists
        fields = '__all__'

    def validate(self, attrs):
        validated_data =  super().validate(attrs)
        if self.Meta.model.objects.filter(list=validated_data['list'],profile=validated_data['profile']).exists():
            raise DotsValidationError({"profile":['This profile already exists in the list.']})
        return validated_data
    


class RemoveProfileSerializer(serializers.Serializer):
    profile = serializers.PrimaryKeyRelatedField(queryset=CandidateProfiles.objects.all(),required=True)


class GetProfileListSerializer(serializers.Serializer):
    profile_list = serializers.PrimaryKeyRelatedField(queryset=ProfileLists.objects.none(),required=True)


    def __init__(self,*args, **kwargs):
        request = kwargs['context']['request']
        user_team = request.user.get_team
        profiles = ProfileLists.objects.filter(created_by__in=user_team)
        super(GetProfileListSerializer,self).__init__(*args, **kwargs)
        self.fields['profile_list'].queryset = profiles



class ListProfileSerializer(serializers.ModelSerializer): # obsoluted as our requirements changed to calculate seniority
    profile = CandidateProfileSerializer()

    class Meta:
        model = SavedProfilesLists
        fields = ['profile']
        