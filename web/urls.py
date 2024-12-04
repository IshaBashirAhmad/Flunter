from django.urls import path
from . import views

urlpatterns = [
    path('', views.homepage, name='homepage'),
    path('search/', views.searchpage, name='searchpage'),
    path('terms-conditions/', views.terms_and_conditions, name='terms_and_conditions'),
    path('privacy-policy/', views.privacy_policy, name='privacy_policy'),
    path('security-policy/', views.security_policy, name='security_policy'),
    path('opt-out/', views.opt_out, name="opt_out"),

    path('login/', views.login, name='common_login'),
    path('signup/', views.signup, name='common_signup'),
    path('forgot-password/', views.forgot_password, name='common_forgot_password'),
    path('verify-code/', views.verify_code, name='common_verify_code'),
    path('reset-password/<str:token>', views.reset_password, name='common_reset_password'),

    path('search-profile/', views.search_profile, name='search_profile'),
    path('recent-searches/', views.recent_searches, name='recent_searches'),
    path('saved-searches/', views.saved_searches, name='saved_searches'),
    path('update-personal-info/', views.change_personal_info, name='change_personal_info'),
    path('subscription/', views.subscription, name='subscription'),
    path('subscription-successful/', views.subscription_successful, name='subscription_successful'),
    path('plans-comparison/', views.plans_comparison, name='plans_comparison'),
    path('resources/', views.resources, name='resources'),
    path('account/', views.my_account, name='my_personal_account'),

    path('create-stripe-id/', views.create_stripe_ids, name='create_stripe_ids'),
    path('create-default-subscriptions/', views.create_default_subscriptions, name='create_default_subscriptions'),
    # path('delete-candidates/', views.delete_all_candidates, name='delete_all_candidates'),
    # path('delete-duplicates/', views.delete_all_duplicates, name='delete_all_duplicates'),
    path('delete-saved-searches/', views.delete_saved_searches, name='delete_saved_searches'),
    
    #saved profiles
    path('saved-profiles/', views.saved_profiles, name='saved_profiles'),
    path('opened-profiles/', views.opened_profiles, name='opened_profiles'),
    path('credit-balance/', views.credit_balance, name='credit_balance'),
    
    # mylist
    path('my-list/', views.my_list, name="my_list"),
    path('list-candidates/<pk>/', views.list_candidates, name="list_candidates"),

    # shared profiles
    path('shared-profile/', views.shared_profile, name="shared_profile"),
    path('specific-shared-profile/<int:pk>/', views.specific_shared_profile, name="specific_shared_profile"),

    # activities
    path('activities/', views.activities, name="activities"),
    path('specific-activity-profile/<int:pk>/', views.specific_activity_profile, name="specific_activity_profile"),

    # needs
    path('needs/', views.needs, name="web_needs"),
]
