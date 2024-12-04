from django.urls import include, path
from rest_framework.routers import DefaultRouter
from api.jwtauth.views import OTPViewSet,PasswordResetView

from api.jwtauth.views import RegistrationViewSet,UserMeViewset,UserUpdateView
from api.subscriptions.views import SubscriptionPlanViewSet,CreateSubscriptionViewSet,PaymentMethodView,test,StripeIntent,change,detached_cards,UserInvoicesView
from api.auth_users.views import AuthUserViewSet,AuthUserUpdateView,UserTeamViewSet
from api.subscriptions.webhook import Webhook
from api.asb.views import CandidateProfileViewSet,ViewCandidateDataViewSet,FavoriteCandidateToggle,ReportProfileView
from api.actions.views import ProfileActionsViewSet
from api.shared_profiles.views import SharedProfileViewSets
from api.my_lists.views import UserListViewset,ListProfileViewSet
from api.saved_searches.views import SaveSearchesViewSet
from api.search_locations.views import SearchLocationViewsets
from api.needs.views import NeedsViewsets

router = DefaultRouter(trailing_slash=False)

router.register("user/register", RegistrationViewSet, basename="user-register")
router.register("auth-user", AuthUserViewSet, basename="auth-user")
router.register("auth-user/update", AuthUserUpdateView, basename="auth-user-update")
router.register(r"otp", OTPViewSet, basename="otp")
router.register(r"password", PasswordResetView, basename="password")
router.register(r"subscriptions", SubscriptionPlanViewSet, basename="subscribe")
router.register(r"subscription/create", CreateSubscriptionViewSet, basename="create-subscribe")
router.register(r"candidate/profiles", CandidateProfileViewSet, basename="candidate-profiles")
router.register(r"save/candidate", FavoriteCandidateToggle, basename="save-candidate")
router.register(r"user/team", UserTeamViewSet, basename="user-team")
router.register(r"action", ProfileActionsViewSet, basename="action")
router.register(r"report/candidate",ReportProfileView,basename='report-candidate')
router.register(r"share/candidate",SharedProfileViewSets,basename='share-candidate')
router.register(r"user/list",UserListViewset,basename='user-list')
router.register(r"save/list",ListProfileViewSet,basename='save-list')
router.register(r"save/search",SaveSearchesViewSet,basename='save-search')
router.register(r"search/locations",SearchLocationViewsets,basename='search-location')
router.register(r"needs",NeedsViewsets,basename='needs')



urlpatterns = [
    path('auth/',include('api.jwtauth.urls'),name='auth'),
    path('asb/',include('api.asb_admin.urls'),name='admin'),
    path('me/',UserMeViewset.as_view(),name='me'),
    path("user-update/", UserUpdateView.as_view({"patch": "partial_update"})),
    path("user-update/image/", UserUpdateView.as_view({"patch": "update_picture"})),
    path('webhook/',Webhook.as_view(),name='webhook-handler'),
    path('user/payment/',PaymentMethodView.as_view(),name='user-payment'),
    path('payment/intent/',StripeIntent.as_view(),name='payment-intent'),
    path('test/',test,name='test'),
    path('change/',change,name='chnage'),
    path('user/invoices/',UserInvoicesView.as_view(),name='user-invoices'),
    path("contact/candidate/",ViewCandidateDataViewSet.as_view(),name='contact-detail'),
] + router.urls
