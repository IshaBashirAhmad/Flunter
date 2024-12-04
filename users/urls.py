from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.create_user_or_company, name='register'),
    path('login/', views.user_login, name='user_login'),
    path('logout/', views.signout, name='user_logout'),
    path('send-otp/', views.send_otp, name='send_otp'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('reset-password/', views.reset_password, name='user_reset_password'),

    path('update-user/<int:pk>/', views.update_user, name='user_update_user'),
    path('update-company/<int:pk>/', views.update_company, name='user_update_company'),
    path('update-password/<int:pk>/', views.update_password, name='user_update_password'),

    path('create-authorised-user/', views.create_authorised_user, name='create_authorised_user'),
    path('update-authorised-user/<int:pk>/', views.update_authorised_user, name='update_authorised_user'),
    path('del-authorised-user/<int:pk>/', views.delete_authorised_user, name='delete_authorised_user'),

    path('config/', views.config, name='config'),
    path('initiate-subscription/<int:pk>/', views.initiate_subscription, name='initiate_subscription'),
    path('create-payment-intent/', views.create_payment_intent, name='create_payment_intent'),
    path('webhook/', views.webhook, name='webhook'),

    # path('import-data/', views.import_file_data, name='import_file_data'),
    # path('export-data/', views.export_file_data, name='export_file_data'),

    # path('get-candidate-data/<str:params>/', views.get_candidate_data, name='get_candidate_data'),
    # path('get-duplicate-data/<str:params>/', views.get_duplicate_data, name='get_duplicate_data'),
    # path('resolve-conflict/', views.resolve_conflict, name='resolve_conflict'),
    
    # path('search-matching-profile/', views.search_profile, name='search_matching_profile'),
    path('create-search-record/', views.create_search_record, name='create_search_record'),
    path('save-search/', views.save_search, name='save_search'),
    path('delete-search/<pk>/', views.delete_search, name='delete_search'),
    path('del-search/', views.del_search, name='del_search'),

    path('get-recent-searches/<str:params>/', views.get_recent_searches, name='get_recent_searches'),
    path('get-saved-searches/<str:params>/', views.get_saved_searches, name='get_recent_searches'),
    path('get-contact-list/<str:params>/', views.get_contact_list, name='get_contact_list'),

    path('send-contact-email/', views.send_contact_email, name='send_contact_email'),
    path('send-contact-us-email/', views.send_contact_us_email, name='send_contact_us_email'),
    path('send-opt-out-request/', views.send_opt_out_request, name='send_opt_out_request'),
    
    #contact
    path('update-contact/<pk>/', views.update_contact, name='update_contact'),

    #custom plan
    path('add-custom-plan/', views.add_custom_plan, name='add_custom_plan'),
    path('get-custom-plan-list/<str:params>/', views.get_custom_plan_list, name='get_custom_plan_list'),
    path('update-custom-plan/<int:pk>/', views.update_custom_plan, name='update_custom_plan'),
    path('del-custom-plan/<int:pk>/', views.delete_custom_plan, name='delete_custom_plan'),
    
    #update credits
    path('update-credits/', views.update_credits, name="update_credits"),

    path('save-payment-method/', views.save_payment_method, name='save_payment_method'),

    #trial
    path('start-trial/<int:pk>/', views.start_trial, name='start_trial'),
    path('create-setup-intent/', views.create_setup_intent, name='create-setup-intent'),
    path('update-card/', views.update_card, name="update_card"),

    #report email
    path('report-candidate-email/', views.report_candidate_email, name='report_candidate_email'),

    path('shared-users-list/<int:id>/', views.shared_users_list, name='shared-users-list'),
]