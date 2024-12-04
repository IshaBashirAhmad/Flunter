from api.jwtauth.views import LoginViewSet
from rest_framework_simplejwt.views import TokenRefreshView
from django.urls import include, path
from api.jwtauth.views import LogoutView



urlpatterns = [
    path('login/',LoginViewSet.as_view(),name='api-login'),
    path('logout/',LogoutView.as_view(),name='logout'),
    path("token/refresh/", TokenRefreshView.as_view(), name="gen-access"),
]

