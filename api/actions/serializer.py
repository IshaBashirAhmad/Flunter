from rest_framework import serializers
from api.actions.models import ProfileActions
from api.asb.serializers import ShortCandidateProfileSerializer
from users.serializers import UserTeamSerializer
from api.core.utils import DotsValidationError
from django.utils import timezone



class ActionSerializer(serializers.ModelSerializer):
    action_datetime = serializers.DateTimeField(format="%d-%m-%Y %I:%M %p")
    
    class Meta:
        model = ProfileActions
        fields = '__all__'


    def validate_action_datetime(self, value):
        if value > timezone.now():
            raise DotsValidationError({"action_date":["Future dates are not allowed please select a valid date."]})
        return value


class ReturnActionSerializer(ActionSerializer):
    profile = ShortCandidateProfileSerializer()
    created_at = serializers.DateTimeField(format="%d-%m-%Y %I:%M %p")
    created_by = UserTeamSerializer()
    action_datetime = serializers.DateTimeField(format="%d-%m-%Y %I:%M %p")
    is_mine = serializers.SerializerMethodField()


    class Meta(ActionSerializer.Meta):
        fields = ['id','profile','action_type','created_at','created_by','action_datetime','comment','is_mine']


    def get_is_mine(self,obj):
        user = self.context['user']
        return True if obj.created_by == user else False



class UpdateActionSerializer(ActionSerializer):

    class Meta(ActionSerializer.Meta):
        fields = ['action_type','comment','action_datetime']


    
class ShortActionSerializer(ActionSerializer):
    created_by = UserTeamSerializer()
    is_mine = serializers.SerializerMethodField()

    
    class Meta(ActionSerializer.Meta):
        fields = ['id','created_by','action_type','comment','action_datetime','is_mine']
    

    def get_is_mine(self,obj):
        user = self.context['user']
        return True if obj.created_by == user else False