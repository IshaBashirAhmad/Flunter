from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from api.asb.serializers import CandidateProfileSerializer,ViewContactSerializer,FavoriteCandidateSerializer,ReportSerializer
from api.core.pagination import CustomPagination
from api.core.percentage_calculations import get_percentage
from api.core.search_filters import CandidateProfileFilters,GenericCanidateProfileFilters
from api.core.permissions import HaveSubscribe
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from api.asb.models import FavoriteCandidates
from api.core.mixin import GenericDotsViewSet,ListModelMixin,RetrieveDotsModelMixin
from rest_framework.decorators import action
from django.db.models import Subquery



from aisearchbot.models import CandidateProfiles


class CandidateProfileViewSet(GenericDotsViewSet,ListModelMixin,RetrieveDotsModelMixin):
    serializer_class = CandidateProfileSerializer
    permission_classes = [HaveSubscribe]
    queryset = CandidateProfiles.objects.all()
    pagination_class = CustomPagination
    filter_backends = (DjangoFilterBackend,OrderingFilter)
    filterset_class = CandidateProfileFilters
    ordering_fields = ['id','percentage']


    @action(
    detail=False, 
    methods=["GET"], 
    url_path="opened", 
    pagination_class=CustomPagination, 
    permission_classes=[IsAuthenticated], 
    filter_backends=(DjangoFilterBackend,), 
    filterset_class=GenericCanidateProfileFilters,
    )

    def opened_profiles(self, request, *args, **kwargs):
        user_or_parant = request.user.get_parent_or_user
        access_logs = user_or_parant.access_log.all().values('candidate')
        candidates = CandidateProfiles.objects.get_seniority().filter(id__in=Subquery(access_logs))
        filtered_logs = self.filter_queryset(candidates)
        page = self.paginate_queryset(filtered_logs)
        if page:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(filtered_logs, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)
    

    def get_serializer_context(self):
        data = super().get_serializer_context()
        data['user'] = self.request.user
        return data

    

    def get_queryset(self):
        queryset = CandidateProfiles.objects.get_seniority()
        data = get_percentage(self,queryset)
        return data

class ViewCandidateDataViewSet(APIView):
    permission_classes = [HaveSubscribe]
    serializer = ViewContactSerializer


    def post(self,request,*args, **kwargs):
        serializer = self.serializer(data=request.data,context={'user':request.user})
        serializer.is_valid(raise_exception=True)
        data = serializer.get_data(serializer.validated_data)
        return Response({"data":data},status=status.HTTP_200_OK)



class FavoriteCandidateToggle(GenericDotsViewSet,ListModelMixin):
    permission_classes = [HaveSubscribe]
    queryset = FavoriteCandidates.objects.all()
    serializer_create_class = FavoriteCandidateSerializer
    serializer_class = CandidateProfileSerializer
    pagination_class = CustomPagination
    filter_backends = (DjangoFilterBackend,)
    filterset_class = GenericCanidateProfileFilters

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer_create(data=request.data)
        serializer.is_valid(raise_exception=True)
        candidate_id = serializer.validated_data['candidate_profile'].id
        fav, created = FavoriteCandidates.objects.get_or_create(
            user=request.user,
            candidate_id=candidate_id
        )
        if created:
            message = "Item added to favorites."
        else:
            fav.delete()
            message = "Item removed from favorites."

        return Response({'candidate': [message]},status=status.HTTP_200_OK)


    def get_serializer_context(self):
        data = super().get_serializer_context()
        data['user'] = self.request.user
        return data
    
    def get_queryset(self):
        if self.request.user.is_anonymous:
            return FavoriteCandidates.objects.none()
        data =  super().get_queryset()
        data = data.filter(user=self.request.user).values('candidate')
        return CandidateProfiles.objects.get_seniority().filter(id__in=Subquery(data))
    





class ReportProfileView(GenericDotsViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ReportSerializer


    def create(self,request,*args, **kwargs):
        serializer = self.get_serializer(data=request.data,context={'user':request.user})
        serializer.is_valid(raise_exception=True)
        serializer.report_profile(serializer.validated_data)
        return Response({"report":["Your report has been submitted."]},status=status.HTTP_200_OK)
