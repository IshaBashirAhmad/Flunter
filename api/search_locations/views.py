from api.core.mixin import GenericDotsViewSet
from api.search_locations.serializers import SearchLocationSerializer
from api.search_locations.models import SearchLocation
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action









class SearchLocationViewsets(GenericDotsViewSet):
    permission_classes = [AllowAny]
    serializer_class = SearchLocationSerializer
    queryset = SearchLocation.objects.all()


    @action(detail=False, url_path="list")
    def list_dropdown(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset)
        return Response({"data": serializer.data})

    def get_queryset(self):
        data =  super().get_queryset()
        return data.first()