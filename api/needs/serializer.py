from rest_framework import serializers
from api.core.utils import DotsValidationError
from api.needs.models import Needs
from datetime import datetime






class NeedsSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Needs
        fields = '__all__'


    def validate(self, attrs):
        validated_data =  super().validate(attrs)
        city = validated_data.get('city',None)
        state = validated_data.get('state',None)
        region = validated_data.get('region',None)
        country = validated_data.get('country',None)
        
        if not any([city,state,region,country]):
            raise DotsValidationError({"save_search":["Please add atleast one filter: [city,state,country,region]."]})
        
        start_date = validated_data.get('start_date')
        end_date = validated_data.get('end_date')
        
        if start_date and end_date:            
            if start_date > end_date:
                raise DotsValidationError({"end_date": ["End date cannot be on or before start date."]})
        
        return validated_data
