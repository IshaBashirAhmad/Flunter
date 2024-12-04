from django import forms
from users.models import Contact, User, Company
from .models import FlunterInfo

class UserChangeForm(forms.ModelForm):
    
    def __init__(self, *args, **kwargs):
        super(UserChangeForm, self).__init__(*args, **kwargs)
        self.fields['role'].widget.attrs['disabled'] = True
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone_number', 'role', 'profile_picture']

    def clean_first_name(self):
        first_name = self.cleaned_data.get('first_name')
        if not first_name:
            raise forms.ValidationError("First name cannot be empty.")
        return first_name

    def clean_last_name(self):
        last_name = self.cleaned_data.get('last_name')
        if not last_name:
            raise forms.ValidationError("Last name cannot be empty.")
        return last_name

    # def clean_company_name(self):
    #     name = self.cleaned_data.get('company_name')
    #     if not name:
    #         raise forms.ValidationError("Company name cannot be empty.")
    #     return name
    
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError("This email address is already in use.")
        elif not email:
            raise forms.ValidationError("Email cannot be empty.")
        return email

    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        # print(le)
        if not len(phone_number) > 10:
            raise forms.ValidationError("Phone number must be more 10 digits.")
        if User.objects.filter(phone_number=phone_number).exclude(id=self.instance.id).exists():
            raise forms.ValidationError("User with phone number already exists")
        return phone_number

    def clean_profile_picture(self):
        profile_picture = self.cleaned_data.get('profile_picture')
        if profile_picture and profile_picture.size > 5 * 1024 * 1024:  # 5 MB
            raise forms.ValidationError("Profile picture size should be less than 5MB.")
        return profile_picture
    
class FlunterInfoUpdateForm(forms.ModelForm):
    class Meta:
        model = FlunterInfo
        fields = ['phone_number', 'email', 'postal_address', 'siret_number']

    def clean_phone_number(self):
        phone_number = self.cleaned_data.get('phone_number')
        if not len(phone_number) > 10:
            raise forms.ValidationError("Phone number must be a 10-digit numeric value.")
        return phone_number

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exclude(pk=self.instance.pk).exists():
            raise forms.ValidationError("This email address is already in use.")
        elif not email:
            raise forms.ValidationError("Email cannot be empty.")
        return email

    def clean_postal_address(self):
        postal_address = self.cleaned_data.get('postal_address')
        if not postal_address:
            raise forms.ValidationError("Postal address field is required.")
        return postal_address

    def clean_siret_number(self):
        siret_number = self.cleaned_data.get('siret_number')
        if not siret_number.isdigit() or len(siret_number) != 14:
            raise forms.ValidationError("SIRET number must be a 14-digit numeric value.")
        return siret_number

class CompanyAddForm(forms.ModelForm):

    class Meta:
        model = Company
        fields = ['company_name', 'company_siret_number', 'company_address', 'designation', 'client_type']


    def clean_company_name(self):
        name = self.cleaned_data.get('company_name')
        if not name:
            raise forms.ValidationError("Company name cannot be empty.")
        return name
    
    # def clean_phone_number(self):
    #     phone_number = self.cleaned_data.get('phone_number')
    #     if not phone_number.isdigit() or len(phone_number) != 10:
    #         raise forms.ValidationError("Phone number must be a 10-digit numeric value.")
    #     return phone_number
    
    def clean_company_siret_number(self):
        siret_number = self.cleaned_data.get('company_siret_number')
        if len(siret_number) != 14:
            raise forms.ValidationError("Company SIRET number must be 14 characters long.")
        return siret_number

    def clean_company_address(self):
        address = self.cleaned_data.get('company_address')
        if not address:
            raise forms.ValidationError("Company address cannot be empty.")
        return address
    
    # def clean_location(self):
    #     address = self.cleaned_data.get('location')
    #     if not address:
    #         raise forms.ValidationError("Company location cannot be empty.")
    #     return address

    def clean_designation(self):
        designation = self.cleaned_data.get('designation')
        if not designation:
            raise forms.ValidationError("Designation cannot be empty.")
        return designation


class ContactProfileForm(forms.ModelForm):
    class Meta:
        model = Contact
        fields = ['designation', 'company', 'country']

    def __init__(self, *args, **kwargs):
        update = kwargs.pop('update', False)
        super(ContactProfileForm, self).__init__(*args, **kwargs)
        if update:
            self.fields.pop('company')