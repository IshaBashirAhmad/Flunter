from django.contrib import admin
from .models import SubscriptionPlans, User,OTP,Company, UserProfile,Subscription, UserSession
from web.models import SharedUsers
# Register your models here.

# admin.site.register(User)
admin.site.register(OTP)
admin.site.register(Company)
admin.site.register(SharedUsers)
admin.site.register(UserProfile)
admin.site.register(Subscription)
admin.site.register(SubscriptionPlans)
admin.site.register(UserSession)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id','first_name', 'last_name', 'email','role', 'is_active')
    # readonly_fields = ('created_at', 'updated_at')