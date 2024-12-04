import os
import stripe
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.utils.translation import gettext as _
from django.dispatch import receiver
from django.conf import settings
from django.utils import timezone
from django.db.models import Q


stripe.api_key = settings.STRIPE_SECRET_KEY


class CustomUserManager(BaseUserManager):

    def create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('The email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, is_superadmin, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        if is_superadmin:
            extra_fields.setdefault('role', User.Roles.SUPER_ADMIN)
            extra_fields.setdefault('is_superadmin', is_superadmin)
        else:
            extra_fields.setdefault('role', User.Roles.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        return self.create_user(email, password, **extra_fields)
    

class User(AbstractUser):

    class Roles(models.TextChoices):
        USER = 'user', _('User')
        COMPANY = 'company', _('Company')
        CONTACT = 'contact', _('Contact')
        ADMIN = 'admin', _('Admin')
        AUTH_USER = 'auth_user', ('Auth_User')
        SUPER_ADMIN = 'super_admin', ('Super_Admin')
        ASB_ADMIN = 'asb_admin', ('asb_admin')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['is_superadmin']
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, default=Roles.USER.value, choices=Roles.choices)
    profile_picture = models.ImageField(upload_to='profiles/', default=settings.DEFAULT_PROFILE_IMAGE, null=True, blank=True)
    stripe_id = models.CharField(max_length=100, blank=True, default='')
    has_used_trial = models.BooleanField(default=False)
    is_superadmin = models.BooleanField(default=False)
    payment_method_id = models.CharField(max_length=255, null=True, blank=True)
    has_subscribed = models.BooleanField(default=False)
    username = None
    objects = CustomUserManager()


 
    @property
    def get_subscription(self):
        sub = self.subscription.all().filter(status=Subscription.Status.ACTIVE).first()
        return sub if sub else None
        
    @property
    def get_auth_users(self):
        return self.auth_users.all()
    
    @property
    def auth_count(self):
        parent_or_user = self.get_parent_or_user
        return parent_or_user.auth_users.all().count()
    
            
    @property
    def get_parent_or_user(self):
        try:
            parent = self.shared_user_profile.belongs_to
            return parent if parent else self
        except:
            return self
        

    @property
    def get_team(self):
        parent_or_user = self.get_parent_or_user
        team = User.objects.filter(Q(shared_user_profile__belongs_to=parent_or_user)| Q(id=parent_or_user.id))
        return team
    
            
    @property
    def get_trial_days(self):
        sub = self.get_subscription
        if sub.is_trial:
            current_date = timezone.now().date()
            remaining_days = (sub.next_payment_date.date() - current_date).days
            if sub.next_payment_date.date() == current_date:
                return "Trial Ends"
            return remaining_days
        return None
    
    @property
    def can_login(self):
        from api.subscriptions.serializers import ShortSubscriptionPlanSerializer
        parent_or_user = self.get_parent_or_user
        count = self.user_tokens.all().count()
        sub = parent_or_user.get_subscription
        limit = 1
        if sub:
            data = ShortSubscriptionPlanSerializer(sub.plan).data
            limit = data['simultaneous_connections_limit']
        return False if count >= limit else True




class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=40, unique=True)
    created = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(default=timezone.now)

    def update_last_activity(self):
        self.last_activity = timezone.now()
        self.save()


class UserProfile(models.Model):
    class Genders(models.TextChoices):
        MALE = 'male', _('Male')
        FEMALE = 'female', _('Female')

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='user_profile')
    gender = models.CharField(max_length=10, choices=Genders.choices)
    country = models.CharField(max_length=100)
    client_type = models.CharField(max_length=50, null=True, blank=True)


class Company(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_profile')
    company_name = models.CharField(max_length=100)
    company_siret_number = models.CharField(max_length=14)
    company_address = models.TextField()
    designation = models.CharField(max_length=100)
    client_type = models.CharField(max_length=50, null=True, blank=True)


class Contact(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='contact_profile')
    # company = models.CharField(max_length=100)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)
    designation = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    client_type = models.CharField(max_length=50)


class OTP(models.Model):
    class Otp_types(models.TextChoices):
        create = 'create', 'create'
        forgot = 'forgot', 'forgot'

    email  = models.EmailField(max_length=100)
    code = models.IntegerField(null=True)
    type = models.CharField(max_length=100,null=True, choices=Otp_types.choices, blank=True)
    verification_token = models.CharField(max_length=200 , null=True)
    used = models.BooleanField(default=False, null=True)
    timeout = models.DateTimeField(null=True)
    created_at = models.DateTimeField(null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email    


class SubscriptionPlans(models.Model):
    name = models.CharField(max_length=100)
    monthly_price = models.PositiveIntegerField(null=True, blank=True)
    yearly_price = models.PositiveIntegerField(null=True, blank=True)
    price_id_monthly = models.CharField(max_length=100, default='', null=True, blank=True)
    price_id_yearly = models.CharField(max_length=100, default='', null=True, blank=True)
    searches_per_month = models.PositiveIntegerField(default=20, null=True, blank=True)
    saved_searches_limit = models.PositiveIntegerField(default=5, null=True, blank=True)
    users_limit = models.PositiveIntegerField(default=1, null=True, blank=True)
    simultaneous_connections_limit = models.PositiveIntegerField(default=1, null=True, blank=True)
    credits = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.price_id_monthly:
            self.price_id_monthly = ''
        if not self.price_id_yearly:
            self.price_id_yearly = ''
        if self.searches_per_month == 0:
            self.searches_per_month = None
        if self.saved_searches_limit == 0:
            self.saved_searches_limit = None
        if self.users_limit == 0:
            self.users_limit = None
        super(SubscriptionPlans, self).save(*args, **kwargs)


class Subscription(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', _("Pending")
        REJECTED = 'rejected', _("Rejected")
        CANCELED = 'canceled', _("Canceled")
        ACTIVE = 'active', _("Active")
    
    class Interval(models.TextChoices):
        MONTHLY = 'monthly', _("Monthly")
        YEARLY = 'yearly', _("Yearly")
        BIWEEKLY = 'biweekly', _("Biweekly")

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(SubscriptionPlans, on_delete=models.PROTECT, related_name='user_subscriptions')
    stripe_subscription_id = models.CharField(max_length=255, blank=True, default='')
    latest_payment_client_secret = models.CharField(max_length=255, blank=True, default='')
    last_payment_date = models.DateTimeField(blank=True, null=True)
    next_payment_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    subscription_interval = models.CharField(max_length=20, choices=Interval.choices, default=Interval.MONTHLY)
    remaining_credits = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_trial = models.BooleanField(default=False)

    class Meta:
        db_table = 'subscriptions'
        ordering = ['-id']

    def __str__(self):
        return f"Subscription for {self.user.email}"
    
    def set_default_plan(self):
        self.status = Subscription.Status.ACTIVE
        self.stripe_subscription_id = ""
        self.latest_payment_client_secret = ""
        self.plan_id = SubscriptionPlans.objects.first()
        self.last_payment_date = timezone.now()
        self.subscription_interval = Subscription.Interval.MONTHLY
        self.save()
    
    def activate_subscription(self):
        self.status = Subscription.Status.ACTIVE
        self.last_payment_date = timezone.now()
        self.save()
    
    # NOTE: this function assumes that if the current subscription isn't active then the fallback free plan is returned
    # def get_active_plan(self):
    #     if self.status != self.Status.ACTIVE:
    #         return SubscriptionPlans.objects.first()
    #     return self.plan
    

class TemporarySubscriptionData(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', _("Pending")
        REJECTED = 'rejected', _("Rejected")
        CANCELED = 'canceled', _("Canceled")
        ACTIVE = 'active', _("Active")
    
    class Interval(models.TextChoices):
        MONTHLY = 'monthly', _("Monthly")
        YEARLY = 'yearly', _("Yearly")

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlans, on_delete=models.PROTECT)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, default='')
    latest_payment_client_secret = models.CharField(max_length=255, blank=True, default='')
    user_payment_method_id = models.CharField(max_length=255, null=True, blank=True)
    last_payment_date = models.DateTimeField(blank=True, null=True)
    next_payment_date = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    subscription_interval = models.CharField(max_length=20, choices=Interval.choices, default=Interval.MONTHLY)
    remaining_credits = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_trial = models.BooleanField(default=False)


class CustomPlan(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='custom_subscription')
    monthly_price = models.PositiveIntegerField(null=True, blank=True)
    # yearly_price = models.PositiveIntegerField(null=True, blank=True)
    # searches_per_month = models.PositiveIntegerField(default=20, null=True, blank=True)
    searches_per_month = models.PositiveIntegerField(default=20, null=True, blank=True)
    saved_searches_limit = models.PositiveIntegerField(default=5, null=True, blank=True)
    users_limit = models.PositiveIntegerField(default=1, null=True, blank=True)
    credits = models.PositiveIntegerField(null=True, blank=True)
    remaining_credits = models.PositiveIntegerField(null=True, blank=True)
    simultaneous_connections_limit = models.PositiveIntegerField(default=1, null=True, blank=True)
    last_payment_date = models.DateTimeField(blank=True, null=True)
    next_payment_date = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)



# Signals

@receiver(models.signals.pre_save, sender=User)
def auto_update_file_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return False
    try:
        old_image_file = sender.objects.get(pk=instance.pk).profile_picture
    except sender.DoesNotExist:
        return False
    if old_image_file and old_image_file != settings.DEFAULT_PROFILE_IMAGE:
        new_image_file = instance.profile_picture
        if old_image_file != new_image_file and new_image_file:
            if os.path.isfile(old_image_file.path):
                os.remove(old_image_file.path)



@receiver(models.signals.post_save, sender=User, dispatch_uid='create_stripe_customer')
def create_stripe_customer(sender, instance, created, **kwargs):
    if created:
        try:
            if instance.role in [User.Roles.USER,User.Roles.COMPANY]:
                name = f'{instance.first_name} {instance.last_name}'
                phone = instance.phone_number
                stripe_customer = stripe.Customer.create(name=name, email=instance.email, phone=phone)
                instance.stripe_id = stripe_customer.id
                instance.save()
        except stripe.error.StripeError as e:
            print("Stripe Error:", str(e))


@receiver(models.signals.post_save, sender=Company, dispatch_uid='create_stripe_company')
def create_stripe_customer(sender, instance, created, **kwargs):
    if created:
        try:
            user = instance.user
            stripe.Customer.modify(
                user.stripe_id,
                address={
                    "line1": instance.company_address,
                }
            )
        except stripe.error.StripeError as e:
            print("Stripe Error:", str(e))


# @receiver(models.signals.post_save, sender=User, dispatch_uid='create_default_subscription')
# def create_stripe_customer(sender, instance, created, **kwargs):
#     if created:
#         try:
#             update_fields = {'plan_id': 1, 'stripe_subscription_id': '', 'latest_payment_client_secret': '', 'status': Subscription.Status.ACTIVE, 'subscription_interval': Subscription.Interval.MONTHLY}
#             subscription = Subscription.objects.update_or_create(user=instance, defaults=update_fields)
#         except Exception as e:
#             print(e)


@receiver(models.signals.post_delete, sender=User)
def auto_delete_file_on_delete(sender, instance, **kwargs):
    if instance.profile_picture and instance.profile_picture != settings.DEFAULT_PROFILE_IMAGE:
        if os.path.isfile(instance.profile_picture.path):
            os.remove(instance.profile_picture.path)