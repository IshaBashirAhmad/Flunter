from api.core.mixin import GenericDotsViewSet,CreateDotsModelMixin
from api.core.pagination import CustomPagination
from api.shared_profiles.serializer import SharedProfileSerializer,ReturnSharedProfile
from api.core.permissions import IsAppUser
from api.shared_profiles.models import SharedProfiles
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.response import Response
from api.core.shared_profile_filter import SharedToFilter,SharedProfileFromFilter
from rest_framework import status
from rest_framework.decorators import action






class SharedProfileViewSets(GenericDotsViewSet, CreateDotsModelMixin):
    serializer_class = SharedProfileSerializer
    serializer_create_class = SharedProfileSerializer
    permission_classes = [IsAppUser]
    queryset = SharedProfiles.objects.all()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = None
    pagination_class = CustomPagination 

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer_create(data=request.data)
        serializer.is_valid(raise_exception=True)
        objects = self.perform_create(serializer)
        serializer_display = self.get_serializer(objects, many=True)
        return Response({"data": serializer_display.data}, status=status.HTTP_200_OK)

    @action(detail=False,methods=["GET"],url_path="from",serializer_class=ReturnSharedProfile,filterset_class = SharedToFilter)
    def from_list(self, request, *args, **kwargs):
        return self._shared_profile_response(request)

    @action(detail=False,methods=["GET"],url_path="to",serializer_class=ReturnSharedProfile,filterset_class = SharedProfileFromFilter)
    def to_list(self, request, *args, **kwargs):
        return self._shared_profile_response(request)

    def _shared_profile_response(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)
    
    @action(detail=True,methods=["DELETE"],url_path='to')
    def delete_shared_to(self, request, pk=None, *args, **kwargs):
        shared = self.get_object()
        if shared.deleted_by_shared_from:
            shared.delete()
        else:
            shared.deleted_by_shared_to = True
            shared.save(update_fields=['deleted_by_shared_to'])
        return Response({"data":["Deleted from list."]},status=status.HTTP_204_NO_CONTENT)
    

    @action(detail=True,methods=["DELETE"],url_path='from')
    def delete_shared_from(self, request, pk=None, *args, **kwargs):
        shared = self.get_object()
        if shared.deleted_by_shared_to:
            shared.delete()
        else:
            shared.deleted_by_shared_from = True
            shared.save(update_fields=['deleted_by_shared_from'])
        return Response({"data":["Deleted from list."]},status=status.HTTP_204_NO_CONTENT)
    


    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return SharedProfiles.objects.none()
        if self.action == 'from_list' or self.action == 'delete_shared_from':
            return user.shared_from.all().filter(deleted_by_shared_from=False) if self.action == 'from_list' else user.shared_from.all()
        elif self.action == 'to_list' or self.action == 'delete_shared_to':
            return user.shared_to.all().filter(deleted_by_shared_to=False) if self.action == 'to_list' else user.shared_to.all()
        return super().get_queryset()

