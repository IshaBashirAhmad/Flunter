from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from api.core.mixin import GenericDotsViewSet,UpdateDotsModelMixin
from rest_framework import status
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenViewBase

from api.core.otp_helper import verify_otp
from .serializers import UpdatePassword, UserCreateSerializer,BaseLoginSerializer
from users.serializers import (
    UserProfileSerializer,
    CompanyProfileInfoSerializer,
    UserProfileImageSerializer,
    AuthUserInfo
)
from .serializers import LogoutSerializer
from api.jwtauth.serializers import OTPSerializer,VerifyOTPSerializer,PasswordResetSerializer
from rest_framework.decorators import action
from api.core import helper
from users.models import OTP


User = get_user_model()

class RegistrationViewSet(GenericDotsViewSet):
    serializer_class = UserCreateSerializer
    serializer_create_class = UserCreateSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer_create(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()
        if user.role == User.Roles.USER:
            user_profile = UserProfileSerializer(user.user_profile,context={'request':request})
        elif user.role == User.Roles.COMPANY:
            user_profile = CompanyProfileInfoSerializer(user.company_profile,context={'request':request})
        refresh = RefreshToken.for_user(user)
        token = dict(refresh=str(refresh), access=str(refresh.access_token))
        token['user_profile'] = user_profile.data
        return Response(token)

    def get_serializer_create(self, *args, **kwargs):
        serializer = self.get_serializer_create_class()
        kwargs["context"] = self.get_serializer_context()
        return serializer(*args, **kwargs)


class LoginViewSet(TokenViewBase):
    serializer_class = BaseLoginSerializer
    permission_classes = [AllowAny]

    def get_serializer(self, *args, **kwargs):
        serializer = self.get_serializer_class()
        kwargs["context"] = self.get_serializer_context()
        return serializer(*args, **kwargs)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data,context={'user':request.user})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class UserMeViewset(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role == User.Roles.USER:
            user_profile = UserProfileSerializer(user.user_profile,context={'request':request})
        elif user.role == User.Roles.COMPANY:
            user_profile = CompanyProfileInfoSerializer(user.company_profile,context={'request':request})
        elif user.role == User.Roles.AUTH_USER:
            user_profile = AuthUserInfo(user,context={'request':request})
            data = {
                    'user':user_profile.data
                }
            return Response(data, status=status.HTTP_200_OK)
        return Response({'data':user_profile.data}, status=status.HTTP_200_OK)
    

class UserUpdateView(GenericDotsViewSet,UpdateDotsModelMixin): # overiding the serializing methods to make this view more generic to handle both users
    serializer_create_class = UserProfileSerializer
    serializer_class = CompanyProfileInfoSerializer
    permission_classes = [IsAuthenticated]
    queryset = User.objects.none()

    def get_object(self):
        if self.request.user.is_anonymous: # bypass the swagger error logs
            return None
        elif self.request.user.role == User.Roles.USER:
            return self.request.user.user_profile
        elif self.request.user.role == User.Roles.COMPANY:
            return self.request.user.company_profile
        elif self.request.user.role == User.Roles.AUTH_USER:
            return self.request.user
        
    def get_serializer_create_class(self):
        if self.request.user.role == User.Roles.USER:
            return self.serializer_create_class
        elif self.request.user.role == User.Roles.COMPANY:
            return self.serializer_class
        elif self.request.user.role == User.Roles.AUTH_USER:
            return AuthUserInfo
        
    def get_serializer_class(self):
        if self.request.user.is_anonymous: # bypass the swagger error logs
            return self.serializer_create_class
        elif self.request.user.role == User.Roles.USER:
            return self.serializer_create_class
        elif self.request.user.role == User.Roles.COMPANY:
            return self.serializer_class
        elif self.request.user.role == User.Roles.AUTH_USER:
            return AuthUserInfo
        

    def get_serializer_create(self, *args, **kwargs):
        serializer = self.get_serializer_create_class()
        kwargs["context"] = self.get_serializer_context()
        return serializer(*args, **kwargs)
        
    def get_serializer_context(self):
        data = super().get_serializer_context()
        data['user'] = self.request.user
        return data
    
    def update_picture(self,request,*args, **kwargs):
        serializer = UserProfileImageSerializer(data=request.data,partial=True,instance=request.user,context={'request':request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"user":[serializer.data]},status=status.HTTP_200_OK)

class OTPViewSet(GenericDotsViewSet):
    serializer_class = OTPSerializer
    queryset = OTP.objects.all()
    permission_classes = [AllowAny]

    @action(detail=False, methods=["POST"], url_path="send", queryset=OTP.objects.all(), serializer_class=OTPSerializer)
    def generate_otp(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return helper.SuccessResponse("OTP sent successfully")

    @action(detail=False, methods=["PATCH"], url_path="verify", queryset=OTP.objects.all(), serializer_class=VerifyOTPSerializer)
    def verify_otp(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        otp_type = serializer.validated_data["otp_type"]

        user_otp = OTP.objects.filter(email=email, type=otp_type).order_by("-pk").first()
        return helper.SuccessResponse({"verification_token": user_otp.verification_token})
    

class PasswordResetView(GenericDotsViewSet):
    serializer_class = UpdatePassword
    permission_classes = [IsAuthenticated]
    queryset = OTP.objects.all()

    @action(detail=False, methods=["PATCH"], url_path="update")
    def update_password(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response({"Message": "Password Updated Successfully"}, status=status.HTTP_200_OK)
    

    @action(detail=False, methods=["PATCH"], url_path="reset", serializer_class=PasswordResetSerializer,permission_classes=[AllowAny])
    def change_password(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verification_token = serializer.validated_data.pop("verification_token")
        password = serializer.validated_data.get("password")
        otp = OTP.objects.filter(verification_token=verification_token).order_by("-pk").first()
        if not otp:
            return Response({"Message": "No Record Found Regenerate Token !"}, status=status.HTTP_400_BAD_REQUEST)
        verify_otp(token=verification_token, email=otp.email, otp_type=otp.type)
        try:
            user = User.objects.get(email=otp.email)
        except User.DoesNotExist:
            return Response({"varification_token": "Invalid Token !"}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(password)
        user.save()
        return Response({"Message": "Password Changed Successfully"}, status=status.HTTP_200_OK)