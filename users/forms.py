from django.contrib.auth.forms import UserCreationForm
from django import forms
from .models import User, UserProfile
from web.models import SharedUsers
from django.core.exceptions import ValidationError

class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('first_name', 'last_name', 'email', 'phone_number', 'profile_picture')
    
    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        if User.objects.filter(phone_number=phone_number).exclude(id=self.instance.id).exists():
            raise ValidationError("User with phone number already exists")
        return phone_number

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['gender', 'country', 'client_type']


class CustomUserUpdateForm(forms.ModelForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('first_name', 'last_name', 'email', 'phone_number', 'profile_picture')
    
    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        if User.objects.filter(phone_number=phone_number).exclude(id=self.instance.id).exists():
            raise ValidationError("User with phone number already exists")
        return phone_number
    
class SharedUsersAddForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('first_name', 'email', 'profile_picture')
    