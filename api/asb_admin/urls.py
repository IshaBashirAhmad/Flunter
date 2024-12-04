from django.urls import path
from api.asb_admin.views import AdminLoginViewSet,AdminProfileViewset,AdminInfoView,ImportFileView,ProfilesViewset,export_file_data,ConflictViewset
from api.jwtauth.views import OTPViewSet,PasswordResetView
from rest_framework.routers import DefaultRouter
from api.auth_users.views import AuthUserViewSet,AuthUserUpdateView

router = DefaultRouter(trailing_slash=False)

router.register(r"otp", OTPViewSet, basename="admin-otp")
router.register(r"password", PasswordResetView, basename="admin-password")
router.register(r"me", AdminInfoView, basename="admin-info")
router.register(r"auth-user", AuthUserViewSet, basename="admin-user")
router.register(r"profiles", ProfilesViewset, basename="asb-profiles")
router.register(r"resolve/conflicts", ConflictViewset, basename="resolve-profiles")



urlpatterns = [
    path('login/',AdminLoginViewSet.as_view(),name='admin-login'),
    path('update/',AdminProfileViewset.as_view({"patch": "partial_update"}),name='admin-profile'),
    path('import/data/',ImportFileView.as_view(),name='import-data'),
    path('auth-user/delete/<pk>',AuthUserUpdateView.as_view({"delete":'destroy'}),name='delete-user'),
    path('auth-user/update/<pk>',AuthUserUpdateView.as_view({"patch":'partial_update'}),name='delete-user'),
    path('auth-user/suspend/<pk>',AuthUserUpdateView.as_view({"patch":'suspend_user'}),name='suspend-user'),
    path('export/profiles/',export_file_data,name='export-data'),

]+router.urls

