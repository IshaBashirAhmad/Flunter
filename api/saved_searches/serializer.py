from rest_framework import serializers
from api.core.utils import DotsValidationError
from api.saved_searches.models import Searches
from users.serializers import UserTeamSerializer







class SavedSearchesSerializer(serializers.ModelSerializer):

    class Meta:
        model = Searches
        fields = '__all__'


    def validate(self, attrs):
        validated_data =  super().validate(attrs)
        keywords = validated_data.get('keywords',None)
        city = validated_data.get('city',None)
        state = validated_data.get('state',None)
        region = validated_data.get('region',None)
        country = validated_data.get('country',None)


        if not any([keywords,city,state,region,country]):
            raise DotsValidationError({"save_search":["Please add atleast one filter: [city,state,country,region,keywords]."]})
        
        return validated_data


class ReturnSavedSearchesSerializer(SavedSearchesSerializer):
    user = UserTeamSerializer()

    class Meta(SavedSearchesSerializer.Meta):
        fields = '__all__'



class UpdateSaveSearchesSerializer(serializers.ModelSerializer):

    class Meta:
        model = Searches
        fields = ['search_type']