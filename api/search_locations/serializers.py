from rest_framework import serializers
from api.search_locations.models import SearchLocation







class SearchLocationSerializer(serializers.ModelSerializer):

    class Meta:
        model = SearchLocation
        fields = ['cities','states','regions','countries']