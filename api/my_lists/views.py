from api.core.mixin import (
    DotsModelViewSet,
    GenericDotsViewSet,
    CreateDotsModelMixin,
)
from api.core.pagination import CustomPagination
from api.core.utils import DotsValidationError
from api.my_lists.models import SavedProfilesLists,ProfileLists
from api.my_lists.serializers import (
    SaveProfilesListsSerializers,
    ProfileListSerializer,
    ReturnProfileListSerializer,
    RemoveProfileSerializer,
    GetProfileListSerializer
)

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from api.core.my_list_filters import ProfileListFilterSets
from rest_framework.response import Response
from rest_framework import status
from api.core.save_profile_filters import SavedProfilesFilterSets
from aisearchbot.models import CandidateProfiles
from django.db.models import Subquery
from api.asb.serializers import CandidateProfileSerializer



class UserListViewset(DotsModelViewSet):
    serializer_class = ReturnProfileListSerializer
    serializer_create_class = ProfileListSerializer
    permission_classes = [IsAuthenticated]
    queryset = ProfileLists.objects.all()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ProfileListFilterSets


    @action(detail=False, methods=["GET"], url_path="recruitment")
    def recruitment(self,request,*args, **kwargs):
        return super().list(self,request, *args, **kwargs)

    @action(detail=False, methods=["GET"], url_path="prospection")
    def prospection(self,request,*args, **kwargs):
        return super().list(self,request, *args, **kwargs)



    def get_queryset(self):
        if self.request.user.is_anonymous:
            return ProfileLists.objects.none()
        data =  super().get_queryset()
        user_team = self.request.user.get_team
        if self.action == 'recruitment':
            return data.filter(created_by__in=user_team,list_type=ProfileLists.Types.RECRUITMENT.value)
        elif self.action == 'prospection':
            return data.filter(created_by__in=user_team,list_type=ProfileLists.Types.PROSPECTION.value)
        else:
            return data.filter(created_by__in=user_team)
    

    def perform_create(self, serializer):
        serializer.validated_data['created_by'] = self.request.user
        return super().perform_create(serializer)
    

    


class ListProfileViewSet(GenericDotsViewSet,CreateDotsModelMixin):
    serializer_create_class = SaveProfilesListsSerializers
    serializer_class = SaveProfilesListsSerializers
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination
    filter_backends = (DjangoFilterBackend,)
    filterset_class = SavedProfilesFilterSets



    @action(detail=False, methods=["POST"], url_path="remove")
    def remove_profile(self,request,*args, **kwargs):
        serializer = RemoveProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.validated_data['profile']
        user_team = request.user.get_team
        profiles = SavedProfilesLists.objects.filter(list__created_by__in=user_team,profile=profile)
        if not profiles:
            raise DotsValidationError({"profile":['Save profile first to remove.']})
        profiles.delete()
        return Response({"profile":["Profile Removed Successfully."]},status=status.HTTP_200_OK)
    

    
    @action(detail=True, methods=["GET"],filter_backends=(DjangoFilterBackend,),filterset_class=SavedProfilesFilterSets)
    def get_profiles(self,request,pk=None,*args, **kwargs):
        serializer = GetProfileListSerializer(data={"profile_list":pk},context={'request':request})
        serializer.is_valid(raise_exception=True)
        list_object = serializer.validated_data['profile_list']
        profile_lists = self.filter_queryset(list_object.profile_lists.all())
        profile_lists = CandidateProfiles.objects.get_seniority().filter(id__in=Subquery(profile_lists.values('profile')))
        page = self.paginate_queryset(profile_lists)
        list_serializer = CandidateProfileSerializer(page,many=True,context={'user':request.user})
        return self.get_paginated_response(list_serializer.data)




    def get_queryset(self):
        return ProfileLists.objects.none()