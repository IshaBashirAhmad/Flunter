from api.asb_admin.serializers import AdminInfoSerializer, AdminLoginSerializer,AdminProfileSerializer,ConflictSerialzer,ResolveConflictsSerializer
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenViewBase
from api.core.mixin import GenericDotsViewSet,UpdateDotsModelMixin,ListModelMixin,DestroyDotsModelMixin
from django.contrib.auth import get_user_model
from api.core.permissions import IsASBAuth
from rest_framework.response import Response
from rest_framework import status
from aisearchbot.helpers import parallel_bulk_insert, parallel_duplicate_bulk_insert, process_dataframe, separate_instances
from aisearchbot.models import CandidateProfiles, DuplicateProfiles
from aisearchbot.views import replace_chars_in_file
from rest_framework.parsers import MultiPartParser
from api.asb_admin.serializers import DataFileSerializer
import pandas as pd
import os
from django.db.models import Q
from rest_framework.views import APIView

from api.core.utils import DotsValidationError, resolve_conflicts
from api.asb_admin.serializers import ProfileSerializer
from django_filters.rest_framework import DjangoFilterBackend
from api.core.asb_profile_filters import ProfilesFilterSet
from django.http import HttpResponse
from rest_framework.decorators import api_view,permission_classes
from rest_framework.decorators import action

User = get_user_model()



class AdminLoginViewSet(TokenViewBase):
    serializer_class = AdminLoginSerializer
    permission_classes = [AllowAny]


    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        user = User.objects.filter(email=email).first()
        if user and not user.is_active:
            raise DotsValidationError({'user':['Your account has been suspended by the admin. For further assistance, please contact support.']})
        return super().post(request, *args, **kwargs)

class AdminProfileViewset(GenericDotsViewSet,UpdateDotsModelMixin):
    serializer_class = AdminProfileSerializer
    serializer_create_class = AdminProfileSerializer
    permission_classes = [IsASBAuth]
    queryset = User.objects.none()


    def get_object(self):
        return self.request.user
    

    def get_serializer_context(self):
        data = super().get_serializer_context()
        data['user'] = self.request.user
        return data
    

class AdminInfoView(GenericDotsViewSet):
    permission_classes = [IsASBAuth]
    serializer_class = AdminInfoSerializer


    def list(self,request,*args, **kwargs):
        serializer = self.get_serializer(self.request.user)
        return Response({'user':serializer.data},status=status.HTTP_200_OK)



class ImportFileView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsASBAuth]

    def post(self, request, *args, **kwargs):
        serializer = DataFileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file = serializer.validated_data['data_file']
        file_extension = os.path.splitext(file.name)[1].lower()
        column_map = {
            'full_name': 'full_name',
            'first_name': 'first_name',
            'last_name': 'last_name',
            'headline': 'headline',
            'current_position': 'current_position',
            'company_name': 'company_name',
            'person_city': 'person_city',
            'person_state': 'person_state',
            'person_country': 'person_country',
            'person_industry': 'person_industry',
            'tags': 'tags',
            'person_skills': 'person_skills',
            'education_experience': 'education_experience',
            'company_website': 'company_website',
            'email_perso': 'email1',
            'email_pro': 'email2',
            'landline': 'phone1',
            'cell_phone': 'phone2',
            'person_linkedin_url': 'person_linkedin_url',
            'company_size_from': 'company_size_from',
            'company_size_to': 'company_size_to',
            'current_position_2': 'current_position_2',
            'current_company_2': 'current_company_2',
            'previous_position_2': 'previous_position_2',
            'previous_company_2': 'previous_company_2',
            'previous_position_3': 'previous_position_3',
            'previous_company_3': 'previous_company_3',
            'company_city': 'company_city',
            'company_state': 'company_state',
            'company_country': 'company_country',
            'person_angellist_url': 'person_angellist_url',
            'person_crunchbase_url': 'person_crunchbase_url',
            'person_twitter_url': 'person_twitter_url',
            'person_facebook_url': 'person_facebook_url',
            'company_linkedin_url': 'company_linkedin_url',
            'person_image_url': 'person_image_url',
            'company_logo_url': 'company_logo_url',
        }

        column_map_lower = {key.lower(): value for key, value in column_map.items()}

        cleaned_data, status_response = replace_chars_in_file(file, column_map_lower)
        if not status_response['success']:
            return Response(status_response, status=status.HTTP_400_BAD_REQUEST)

        if file_extension in ['.xlsx', '.xls']:
            df = pd.concat(cleaned_data.values(), ignore_index=True)
        else:
            df = cleaned_data

        df.fillna('', inplace=True)

        valid_columns = list(column_map_lower.keys())
        df = df[[col for col in df.columns if col.lower() in valid_columns]]

        df['person_state'] = df['person_state'].str.replace(' ', '-')
        df['person_city'] = df['person_city'].str.replace(' ', '-')

        new_instances = []
        duplicate_instances = []
        is_duplicate = False

        linkedin_urls = set(df['person_linkedin_url'].dropna().unique())
        email1_list = set(df['email_perso'].dropna().unique())
        email2_list = set(df['email_pro'].dropna().unique())
        full_names = set(df['full_name'].dropna().unique())

        potential_duplicates = CandidateProfiles.objects.filter(
            Q(full_name__in=full_names) |
            Q(person_linkedin_url__in=linkedin_urls) |
            Q(email1__in=email1_list) |
            Q(email2__in=email1_list) |
            Q(email1__in=email2_list) |
            Q(email2__in=email2_list)
        )

        lookup = {
            'full_name': {profile.full_name: profile for profile in potential_duplicates},
            'linkedin': {profile.person_linkedin_url: profile for profile in potential_duplicates},
            'email1': {profile.email1: profile for profile in potential_duplicates},
            'email2': {profile.email2: profile for profile in potential_duplicates}
        }

        df = process_dataframe(df, column_map_lower, lookup)
        new_instances, duplicate_instances = separate_instances(df)

        parallel_bulk_insert(new_instances, chunk_size=1000, max_workers=4)
        
        DuplicateProfiles.objects.all().delete()
        parallel_duplicate_bulk_insert(duplicate_instances, chunk_size=1000, max_workers=4)

        if len(duplicate_instances) > 0:
            is_duplicate = True

        return Response({'success': True, 'message': 'Data uploaded', 'is_duplicate': is_duplicate}, status=status.HTTP_200_OK)







class ProfilesViewset(GenericDotsViewSet,ListModelMixin,DestroyDotsModelMixin):
    serializer_class = ProfileSerializer
    permission_classes = [IsASBAuth]
    queryset = CandidateProfiles.objects.all()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ProfilesFilterSet



class ConflictViewset(GenericDotsViewSet,ListModelMixin):
    serializer_class = ConflictSerialzer
    serializer_create_class = ResolveConflictsSerializer
    queryset = DuplicateProfiles.objects.all()
    permission_classes = [IsASBAuth]
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ProfilesFilterSet

    def create(self,request,*args, **kwargs):
        serializer = self.get_serializer_create(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_200_OK)
    

    @action(detail=False,url_path='keep-recent',methods=['POST'])
    def keep_recent(self,request,*args, **kwargs):
        duplicate_profiles = DuplicateProfiles.objects.get_counts()
        for profile in duplicate_profiles:
            new_count = profile.new_count
            old_count = profile.old_count
            if new_count >= old_count or new_count == old_count:
                resolve_conflicts(duplicate_profile=profile,recent=True)
            else:
                resolve_conflicts(duplicate_profile=profile,recent=False)         

        return Response(status=status.HTTP_200_OK)



@api_view(["GET"])
@permission_classes([IsASBAuth])
def export_file_data(request):
    fields = [field.name for field in CandidateProfiles._meta.fields]

    if 'id' in fields:
        fields.remove('id')

    replacements = {
        'email1': 'Email_perso',
        'email2': 'Email_pro',
        'phone1': 'Landline',
        'phone2': 'Cell_phone'
    }
    
    queryset = CandidateProfiles.objects.all().values(*fields)
    df = pd.DataFrame(list(queryset))
    df = df.rename(columns=replacements, inplace=False)
    
    if 'person_skills' in df.columns:
        df['person_skills'] = df['person_skills'].apply(lambda x: ','.join(x) if isinstance(x, list) else x)
    df = df.reset_index(drop=True)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="data.csv"'
    df.to_csv(response, index=False)
    return response