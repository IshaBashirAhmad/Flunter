from api.saved_searches.models import Searches
from api.core.mixin import DotsModelViewSet
from api.saved_searches.serializer import SavedSearchesSerializer,ReturnSavedSearchesSerializer,UpdateSaveSearchesSerializer
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from api.core.saved_searches_filters import SavedSearchesFilterSets






class SaveSearchesViewSet(DotsModelViewSet):
    serializer_class = ReturnSavedSearchesSerializer
    serializer_create_class = SavedSearchesSerializer
    queryset = Searches.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = (DjangoFilterBackend,)
    filterset_class = SavedSearchesFilterSets

    action_serializers = {
        'partial_update':UpdateSaveSearchesSerializer
    }



    def perform_create(self, serializer):
        serializer.validated_data['user'] = self.request.user
        return super().perform_create(serializer)
    

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return Searches.objects.none()
        data = super().get_queryset().filter(user=user)          
        return data.exclude(search_type=Searches.Types.Recent) if self.action == 'list' else data
    

    def get_serializer_create_class(self):
        if self.action == 'partial_update':
            return self.action_serializers['partial_update']
        return super().get_serializer_create_class()