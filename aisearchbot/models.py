import os
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext as _
from django.dispatch import receiver
from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db.models import Case, When, Value, IntegerField, F,CharField,Q
import re
from datetime import datetime


# class CustomUserManager(BaseUserManager):

#     def create_user(self, email, password, **extra_fields):
#         if not email:
#             raise ValueError('The email must be set')
#         email = self.normalize_email(email)
#         user = self.model(email=email, **extra_fields)
#         user.set_password(password)
#         user.save()
#         return user

#     def create_superuser(self, email, password, **extra_fields):
#         extra_fields.setdefault('is_staff', True)
#         extra_fields.setdefault('is_superuser', True)
#         extra_fields.setdefault('is_active', True)
#         extra_fields.setdefault('role', User.Roles.ADMIN)

#         if extra_fields.get('is_staff') is not True:
#             raise ValueError(_('Superuser must have is_staff=True.'))
#         if extra_fields.get('is_superuser') is not True:
#             raise ValueError(_('Superuser must have is_superuser=True.'))
#         return self.create_user(email, password, **extra_fields)
    

# class User(AbstractUser):

#     class Roles(models.TextChoices):
#         USER = 'user', _('User')
#         ADMIN = 'admin', _('Admin')

#     USERNAME_FIELD = 'email'
#     REQUIRED_FIELDS = []
#     first_name = models.CharField(max_length=100)
#     last_name = models.CharField(max_length=100)
#     phone_number = models.CharField(max_length=20)
#     email = models.EmailField(unique=True)
#     role = models.CharField(max_length=20, default=Roles.USER.value, choices=Roles.choices)
#     profile_picture = models.ImageField(upload_to='profiles/', default=settings.DEFAULT_PROFILE_IMAGE, null=True, blank=True)
#     username = None
#     objects = CustomUserManager()


# class OTP(models.Model):
#     class Otp_types(models.TextChoices):
#         create = 'create', 'create'
#         forgot = 'forgot', 'forgot'

#     email  = models.EmailField(max_length=100)
#     code = models.IntegerField(null=True)
#     type = models.CharField(max_length=100,null=True, choices=Otp_types.choices, blank=True)
#     verification_token = models.CharField(max_length=200 , null=True)
#     used = models.BooleanField(default=False, null=True)
#     timeout = models.DateTimeField(null=True)
#     created_at = models.DateTimeField(null=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return self.email
    

# class SharedUsers(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='shared_user_profile')
#     belongs_to = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    

class CandidateProfilesQuerySet(models.QuerySet):
    def case_insensitive_skills_search(self, search_values):
        search_values = [value.lower() for value in search_values]
        conditions = Q()
        
        for value in search_values:
            conditions |= Q(person_skills__icontains=value)
        
        return conditions
    


class DuplicateProfileManager(models.Manager):

    def get_counts(self):
        return self.annotate(
            new_count=(
                Case(
                    When(email1__isnull=False, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
                + Case(
                    When(email2__isnull=False, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
                + Case(
                    When(phone1__isnull=False, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
                + Case(
                    When(phone2__isnull=False, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            ),
            old_count=(
                Case(
                    When(original_profile__email1__isnull=False, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
                + Case(
                    When(original_profile__email2__isnull=False, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
                + Case(
                    When(original_profile__phone1__isnull=False, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
                + Case(
                    When(original_profile__phone2__isnull=False, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
        )


class CandidateProfilesManager(models.Manager):
    def get_queryset(self):
        return CandidateProfilesQuerySet(self.model, using=self._db)

    def case_insensitive_skills_search(self, search_values):
        return self.get_queryset().case_insensitive_skills_search(search_values)
    
    def get_seniority(self):
        from api.core.utils import ExtractFirstYear
        current_year = datetime.now().year
        return self.annotate(
            first_year=ExtractFirstYear("education_experience"),
            total_experience=Case(
                When(first_year__isnull=False, then=F('first_year') + 4),
                default=Value(0),
                output_field=IntegerField()
            ),
            final_year=Case(
                When(total_experience__gt=0, then=current_year - F('total_experience')),
                default=Value(0),
                output_field=IntegerField()
            ),
            seniority=Case(
                When(total_experience__gte=current_year, then=Value('Junior')),
                When(Q(final_year__gt=0, final_year__lt=2.5), then=Value('Junior')),
                When(Q(final_year__gte=2.5, final_year__lt=5.5), then=Value('Medior')),
                When(Q(final_year__gte=5.5, final_year__lte=11.5), then=Value('Senior')),
                When(final_year__gte=12, then=Value('Expert')),
                When(Q(previous_company_2='') & Q(previous_company_3=''), then=Value('Junior')),
                When(Q(previous_company_2='') | Q(previous_company_3=''), then=Value('Medior')),
                When(Q(previous_company_2__isnull=False) & Q(previous_company_3__isnull=False), then=Value('Senior')),
                default=Value('Junior'),
                output_field=CharField(),
            )
        )

class CandidateProfiles(models.Model):
    full_name = models.TextField(null=True, blank=True)
    first_name = models.TextField(null=True, blank=True)
    last_name = models.TextField(null=True, blank=True)
    headline = models.TextField(null=True, blank=True)
    current_position = models.TextField(null=True, blank=True)
    company_name = models.TextField(null=True, blank=True)
    person_city = models.TextField(null=True, blank=True)
    person_state = models.TextField(null=True, blank=True)
    person_country = models.TextField(null=True, blank=True)
    person_industry = models.TextField(null=True, blank=True)
    tags = models.TextField(null=True, blank=True)
    person_skills = ArrayField(models.CharField(max_length=5000), blank=True, null=True)
    education_experience = models.TextField(null=True, blank=True)
    company_website = models.URLField(max_length=5000, null=True, blank=True)
    email1 = models.EmailField(null=True, blank=True)
    email2 = models.EmailField(null=True, blank=True)
    phone1 = models.TextField(null=True, blank=True)
    phone2 = models.TextField(null=True, blank=True)
    person_linkedin_url = models.URLField(max_length=5000, null=True, blank=True)
    company_size_from = models.IntegerField(null=True, blank=True)
    company_size_to = models.IntegerField(null=True, blank=True)
    current_position_2 = models.TextField(null=True, blank=True)
    current_company_2 = models.TextField(null=True, blank=True)
    previous_position_2 = models.TextField(null=True, blank=True)
    previous_company_2 = models.TextField(null=True, blank=True)
    previous_position_3 = models.TextField(null=True, blank=True)
    previous_company_3 = models.TextField(null=True, blank=True)
    company_city = models.TextField(null=True, blank=True)
    company_state = models.TextField(null=True, blank=True)
    company_country = models.TextField(null=True, blank=True)
    person_angellist_url = models.URLField(max_length=5000, null=True, blank=True)
    person_crunchbase_url = models.URLField(max_length=5000, null=True, blank=True)
    person_twitter_url = models.URLField(max_length=5000, null=True, blank=True)
    person_facebook_url = models.URLField(max_length=5000, null=True, blank=True)
    company_linkedin_url = models.URLField(max_length=5000, null=True, blank=True)
    person_image_url = models.URLField(max_length=5000, null=True, blank=True)
    company_logo_url = models.URLField(max_length=5000, null=True, blank=True)

    objects = CandidateProfilesManager()

    def save(self, *args, **kwargs):
        if self.company_size_from == '':
            self.company_size_from = None
        if self.company_size_to == '':
            self.company_size_to = None
        super(CandidateProfiles, self).save(*args, **kwargs)
    
    def is_saved_for_user(record_id, user_id):
        return SavedListProfiles.objects.filter(
            list__list_user_id=user_id,
            profile_id=record_id
        ).exists()
    



class DuplicateProfiles(models.Model):
    full_name = models.TextField(null=True, blank=True)
    first_name = models.TextField(null=True, blank=True)
    last_name = models.TextField(null=True, blank=True)
    headline = models.TextField(null=True, blank=True)
    current_position = models.TextField(null=True, blank=True)
    company_name = models.TextField(null=True, blank=True)
    person_city = models.TextField(null=True, blank=True)
    person_state = models.TextField(null=True, blank=True)
    person_country = models.TextField(null=True, blank=True)
    person_industry = models.TextField(null=True, blank=True)
    tags = models.TextField(null=True, blank=True)
    person_skills = ArrayField(models.CharField(max_length=5000), blank=True, null=True)
    education_experience = models.TextField(null=True, blank=True)
    company_website = models.URLField(max_length=5000, null=True, blank=True)
    email1 = models.EmailField(null=True, blank=True)
    email2 = models.EmailField(null=True, blank=True)
    phone1 = models.TextField(null=True, blank=True)
    phone2 = models.TextField(null=True, blank=True)
    person_linkedin_url = models.URLField(max_length=5000, null=True, blank=True)
    company_size_from = models.IntegerField(null=True, blank=True)
    company_size_to = models.IntegerField(null=True, blank=True)
    current_position_2 = models.TextField(null=True, blank=True)
    current_company_2 = models.TextField(null=True, blank=True)
    previous_position_2 = models.TextField(null=True, blank=True)
    previous_company_2 = models.TextField(null=True, blank=True)
    previous_position_3 = models.TextField(null=True, blank=True)
    previous_company_3 = models.TextField(null=True, blank=True)
    company_city = models.TextField(null=True, blank=True)
    company_state = models.TextField(null=True, blank=True)
    company_country = models.TextField(null=True, blank=True)
    person_angellist_url = models.URLField(max_length=5000, null=True, blank=True)
    person_crunchbase_url = models.URLField(max_length=5000, null=True, blank=True)
    person_twitter_url = models.URLField(max_length=5000, null=True, blank=True)
    person_facebook_url = models.URLField(max_length=5000, null=True, blank=True)
    company_linkedin_url = models.URLField(max_length=5000, null=True, blank=True)
    person_image_url = models.URLField(max_length=5000, null=True, blank=True)
    company_logo_url = models.URLField(max_length=5000, null=True, blank=True)

    original_profile = models.ForeignKey(CandidateProfiles, on_delete=models.CASCADE)

    objects = DuplicateProfileManager()


    def keep_most_recent(self):
        try:
            profile_data = {field.name: getattr(self, field.name) for field in DuplicateProfiles._meta.fields if field.name != 'original_profile' and field.name != 'id'}
            CandidateProfiles.objects.filter(id=self.original_profile.id).delete()
            CandidateProfiles.objects.create(**profile_data)
        except Exception as e:
            print(e)

    
    def resolve_conflict(self):
        # Fields to compare
        fields_to_compare = ['email1', 'email2', 'phone1', 'phone2']

        # Count non-null fields
        original_non_null_count = sum(1 for field in fields_to_compare if getattr(self.original_profile, field))
        duplicate_non_null_count = sum(1 for field in fields_to_compare if getattr(self, field))

        if duplicate_non_null_count > original_non_null_count:
            # Save the duplicate, delete the original
            print('here in first merge and save')
            self.merge_and_save()
        elif duplicate_non_null_count < original_non_null_count:
            for field in ['email1', 'email2', 'phone1', 'phone2']:
                original_value = getattr(self.original_profile, field)
                duplicate_value = getattr(self, field)
                
                # If duplicate has no value but the original does, copy the value from the original
                if not duplicate_value and original_value:
                    setattr(self, field, original_value)
            print('here in save duplicate')
            self.save_duplicate()
            # # Save the original, delete the duplicate
            # self.delete()
        else:
            print('here in else')
            # Merge data from original to duplicate
            self.merge_and_save()

    def save_duplicate(self):
        try:
            profile_data = {field.name: getattr(self, field.name) for field in DuplicateProfiles._meta.fields if field.name != 'original_profile' and field.name != 'id'}
            original = CandidateProfiles.objects.filter(id=self.original_profile.id)
            if original.exists():
                original.delete()
            CandidateProfiles.objects.create(**profile_data)
        except Exception as e:
            print('in save duplicate', self.original_profile.id)
            print(e)
        # self.save()
        # # Move the record from DuplicateProfiles to CandidateProfiles
        # CandidateProfiles.objects.create(**{field.name: getattr(self, field.name) for field in self._meta.fields})
        # self.original_profile.delete()

    def merge_and_save(self):
        try:
            for field in ['email1', 'email2', 'phone1', 'phone2']:
                if not getattr(self, field) and getattr(self.original_profile, field):
                    setattr(self, field, getattr(self.original_profile, field))
            self.save_duplicate()
        except Exception as e:
            print('in merge and save', e)


class ProfileVisibilityToggle(models.Model):
    search_user_id = models.IntegerField()
    candidate = models.ForeignKey(CandidateProfiles, on_delete=models.CASCADE)
    show_email1 = models.BooleanField(default=False)
    show_email2 = models.BooleanField(default=False)
    show_phone1 = models.BooleanField(default=False)
    show_phone2 = models.BooleanField(default=False)
    is_favourite = models.BooleanField(default=False)


class LocationDetails(models.Model):
    insee_code = models.CharField(max_length=10)
    city_code = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10)
    label = models.CharField(max_length=100)
    latitude = models.CharField(max_length=20)
    longitude = models.CharField(max_length=20)
    department_name = models.CharField(max_length=100)
    department_number = models.CharField(max_length=10)
    region_name = models.CharField(max_length=100)
    region_geojson_name = models.CharField(max_length=100)

    def __str__(self):
        return self.label


class SavedLists(models.Model):
    class Types(models.TextChoices):
        RECRUITMENT = 'recruitment', _('Recruitment')
        PROSPECTION = 'prospection', _('Prospection')

    list_user_id = models.IntegerField()
    name = models.CharField(max_length=100)
    list_type = models.CharField(max_length=20, default=Types.RECRUITMENT.value, choices=Types.choices)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)


class SavedListProfiles(models.Model):
    list = models.ForeignKey(SavedLists, on_delete=models.CASCADE)
    profile = models.ForeignKey(CandidateProfiles, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)


class Actions(models.Model):
    class Types(models.TextChoices):
        CALL = 'call', _('call')
        TEXT_MESSAGE = 'text_message', _('text messages')
        VOICE_EMAIL = 'voice_email', _('voice email')
        EMAIL = 'email', _('email')
        NOTE = 'note', _('note')
        CONVERT = 'convert', _('convert')
    
    action_type = models.CharField(max_length=100, choices=Types.choices, null=True)
    parent_user_id = models.IntegerField()
    action_user_id = models.IntegerField()
    profile = models.ForeignKey(CandidateProfiles, on_delete=models.CASCADE)
    comment = models.TextField(null=True, blank=True)
    action_datetime = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)


class SharedProfiles(models.Model):
    shared_from = models.IntegerField()
    shared_to = models.IntegerField()
    profile = models.ForeignKey(CandidateProfiles, on_delete=models.CASCADE)
    deleted_by_shared_from = models.BooleanField(default=False)
    deleted_by_shared_to = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)


class Need(models.Model):
    user = models.IntegerField()
    name = models.CharField(max_length=128)
    job_title = models.TextField(null=True, blank=True)
    location = models.TextField(null=True, blank=True)
    skills = models.TextField(null=True, blank=True)
    current_company = models.TextField(null=True, blank=True)
    head_count = models.TextField(null=True, blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"user id " + str(self.user) + " searched for "+ self.name
    

# Signals


# @receiver(models.signals.pre_save, sender=User)
# def auto_update_file_on_change(sender, instance, **kwargs):
#     if not instance.pk:
#         return False
#     try:
#         old_image_file = sender.objects.get(pk=instance.pk).profile_picture
#     except sender.DoesNotExist:
#         return False
#     if old_image_file and old_image_file != settings.DEFAULT_PROFILE_IMAGE:
#         new_image_file = instance.profile_picture
#         if not old_image_file == new_image_file:
#             if os.path.isfile(old_image_file.path):
#                 os.remove(old_image_file.path)



# @receiver(models.signals.post_delete, sender=User)
# def auto_delete_file_on_delete(sender, instance, **kwargs):
#     if instance.profile_picture and instance.profile_picture != settings.DEFAULT_PROFILE_IMAGE:
#         if os.path.isfile(instance.profile_picture.path):
#             os.remove(instance.profile_picture.path)