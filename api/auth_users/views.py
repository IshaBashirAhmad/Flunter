from rest_framework.response import Response

from api.core.mixin import GenericDotsViewSet,ListDotsModelMixin,UpdateDotsModelMixin,DestroyDotsModelMixin
from django.contrib.auth import get_user_model
from api.auth_users.serializers import AuthUserSerializer,ReturnAuthUsersSerializer,AuthUserUpdateSerializer
from api.core.permissions import AuthUserPerm,CanSubscribe, IsASB,IsAppUser,CanCreateAuthUser
from rest_framework import status
from web.models import SharedUsers
from users.serializers import UserTeamSerializer
from rest_framework.mixins import ListModelMixin
from flunter.helpers import send_account_credentials_email
from rest_framework.decorators import action

User = get_user_model()
    





class AuthUserViewSet(GenericDotsViewSet,ListDotsModelMixin,ListModelMixin):
    serializer_class = ReturnAuthUsersSerializer
    serializer_create_class = AuthUserSerializer
    permission_classes = [AuthUserPerm]
    queryset = SharedUsers.objects.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer_create(data=request.data)
        serializer.is_valid(raise_exception=True)
        password = serializer.validated_data['password']
        email = serializer.validated_data['email']
        user = serializer.save()
        user_info = self.get_serializer({"user":user})
        send_account_credentials_email(email=email,password=password,url='https://www.dummy.com')
        return Response(user_info.data,status=status.HTTP_200_OK)

    def get_serializer_create(self, *args, **kwargs):
        serializer = self.get_serializer_create_class()
        kwargs["context"] = self.get_serializer_context()
        return serializer(*args, **kwargs)
    
    def get_serializer_context(self):
        data = super().get_serializer_context()
        data['user'] = self.request.user
        return data
    
    def get_queryset(self):
        if self.request.user.is_anonymous:
            return User.objects.none()
        user = self.request.user
        queryset =  super().get_queryset()
        auth_users = queryset.filter(belongs_to=user)
        return auth_users
    
    def get_permissions(self):
        if self.action == "create":
            return [CanCreateAuthUser()]
        return super().get_permissions()



class AuthUserUpdateView(GenericDotsViewSet,UpdateDotsModelMixin,DestroyDotsModelMixin):
    serializer_class = AuthUserUpdateSerializer
    permission_classes = [CanSubscribe]
    queryset = User.objects.all()


    def get_queryset(self):
        if self.request.user.is_anonymous:
            return User.objects.none()
        queryset =  super().get_queryset()
        data = queryset.filter(shared_user_profile__belongs_to=self.request.user)
        return data
    
    # to suspend the admin auth users.

    @action(
    detail=True, 
    methods=["PATCH"], 
    url_path="suspend", 
    permission_classes=[IsASB]
    )
    def suspend_user(self,request,pk=None,*args, **kwargs):
        target_user = self.get_object()
        target_user.is_active = not target_user.is_active
        target_user.save()
        msg = 'This account has been suspended successfully.'
        if target_user.is_active:
            msg = 'This account has been activated successfully.'
        return Response({"user":[msg]},status=status.HTTP_200_OK)





class UserTeamViewSet(GenericDotsViewSet,ListModelMixin):
    permission_classes = [IsAppUser]
    serializer_class = UserTeamSerializer
    queryset = User.objects.all()
    filter_backends = []
    pagination_class = None

    def get_queryset(self):
        if self.request.user.is_anonymous:
            return User.objects.none()
        return self.request.user.get_team