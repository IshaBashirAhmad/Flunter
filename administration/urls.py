from django.urls import path
from . import views
urlpatterns = [

    # admin dashboard
    path('', views.dashboard, name='dashboard'),
    path('dashboard-data/', views.dashboard_data, name='dashboard_data'),

    #authentication
    path('login/', views.admin_login, name='login'),
    path('admin-logout/', views.admin_logout, name='admin_logout'),
    path('send-otp/', views.send_otp, name='send_otp'),
    path('verify-code/', views.verify_code, name='verify_code'),
    path('reset-password/', views.reset_password, name='reset_password'),


    # authorised user
    path('authorised-user/', views.add_authorised_user, name='add_authorised_user'),
    path('delete-user/<pk>/', views.delete_user, name='delete_user'),

    # accounts
    path('account/', views.my_account, name='my_account'),
    path('update-personal-info/', views.change_personal_info, name='change_personal_info'),
    path('update-flunter-info/', views.change_flunter_info, name='change_flunter_info'),
    path('update-flunter-password/', views.change_password, name='change_flunter_password'),

    # company
    path('companies/', views.companies, name='companies'),
    path('add-company/', views.add_company, name='add_company'),
    path('company-detail/<pk>', views.company_detail, name='company_detail'),
    path('company-update/<pk>', views.company_update, name='company_update'),
    path('company-search-list/<pk>/<str:type>', views.company_search_list, name='company_search_list'),


    # contacts
    path('contacts/', views.contacts, name='contacts'),
    path('add-contact/', views.add_contact, name='add_contact'),
    path('contact-detail/<pk>', views.contact_detail, name='contact_detail'),
    path('contact-update/<pk>', views.contact_update, name='contact_update'),
    path('contact-search-list/<pk>/<str:type>', views.contact_search_list, name="contact_search_list"),

    # individual
    path('individuals/', views.individuals, name='individuals'),
    path('add-individual/', views.add_individual, name='add_individual'),
    path('individual-detail/<pk>', views.individual_detail, name='individual_detail'),
    path('individual-update/<pk>', views.individual_update, name='individual_update'),
    path('individual-search-list/<pk>/<str:type>', views.individual_search_list, name='individual_search_list'),

    # custom plan
    path('custom-plan/', views.custom_plan, name='administration_custom_plan'),
    # path('add-contact/', views.add_contact, name='add_contact'),

    #Subscriptions
    path('delete-subscription/<pk>', views.delete_subscription, name='delete_subscription'),
    
    # yearly Revenue data
    path("get-yearly-revenue/", views.get_yearly_revenue, name="get_yearly_revenue")
]