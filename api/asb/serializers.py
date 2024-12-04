from rest_framework import serializers
from api.actions.models import ProfileActions
from api.core.utils import DotsValidationError
from aisearchbot.models import CandidateProfiles
from api.asb.models import ContactFields,UserAccessLog,FavoriteCandidates
from api.core.utils import check_credit_and_deduct
from api.asb.models import ReportChoices
from django.template.loader import get_template
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from api.my_lists.models import SavedProfilesLists


class CandidateProfileSerializer(serializers.ModelSerializer):
    landline = serializers.SerializerMethodField(method_name='get_phone1')
    mobile_phone = serializers.SerializerMethodField(method_name='get_phone2')
    personal_email = serializers.SerializerMethodField(method_name='get_email1')
    pro_email = serializers.SerializerMethodField(method_name='get_email2')
    is_saved = serializers.SerializerMethodField(method_name='get_saved')
    actions = serializers.SerializerMethodField(method_name='profile_actions')
    is_list = serializers.SerializerMethodField(method_name='is_save_list')
    seniority = serializers.CharField(required=False)
    percentage = serializers.IntegerField(default=100)

    class Meta:
        model = CandidateProfiles
        exclude = ['email1', 'email2', 'phone1', 'phone2']

    def get_access_data(self, obj, field_name, field_attr):
        request_user = self.context['user']
        user = request_user.get_parent_or_user
        try:
            access_log = UserAccessLog.objects.get(user=user, candidate=obj)
            if getattr(access_log, field_attr, False):
                return getattr(obj, field_name, False)
            return True if getattr(obj, field_name, False) else False
        except UserAccessLog.DoesNotExist:
            return True if getattr(obj, field_name, False) else False

    def get_phone1(self, obj):
        return self.get_access_data(obj, 'phone1', 'is_phone1')

    def get_phone2(self, obj):
        return self.get_access_data(obj, 'phone2', 'is_phone2')

    def get_email1(self, obj):
        return self.get_access_data(obj, 'email1', 'is_email1')

    def get_email2(self, obj):
        return self.get_access_data(obj, 'email2', 'is_email2')
    
    def get_saved(self,obj):
        request_user = self.context['user']
        fav = FavoriteCandidates.objects.filter(user=request_user,candidate=obj).exists()
        return True if fav else False

    def profile_actions(self,obj):
        from api.actions.serializer import ShortActionSerializer # due to circular import
        user = self.context['user']
        users = user.get_team
        actions = ProfileActions.objects.filter(created_by__in=users,profile=obj)
        return ShortActionSerializer(actions,many=True,context={'user':user}).data
    
    def is_save_list(self,obj):
        user = self.context['user']
        team = user.get_team
        return SavedProfilesLists.objects.filter(list__created_by__in=team,profile=obj).exists()





class ViewContactSerializer(serializers.Serializer):
    candidate_profile = serializers.PrimaryKeyRelatedField(queryset=CandidateProfiles.objects.all(),required=True)
    field = serializers.ChoiceField(choices=ContactFields.choices,required=True)

    def get_data(self, validated_data):
        from api.actions.serializer import ShortActionSerializer # due to circular import
        user = self.context['user']
        user_or_parent = user.get_parent_or_user
        subscription = user_or_parent.get_subscription
        credits = subscription.remaining_credits

        if credits < 1:
            raise DotsValidationError({'credits': ['Not enough credits to perform this action.']})

        profile = validated_data['candidate_profile']
        data = {
            'email1': profile.email1,
            'email2': profile.email2,
            'phone1': profile.phone1,
            'phone2': profile.phone2
        }

        field = validated_data.get('field')
        if not data.get(field):
            raise DotsValidationError({"data": ["No data found for the selected field."]})

        access_log, created = UserAccessLog.objects.get_or_create(user=user_or_parent,candidate=profile)
        action = check_credit_and_deduct(name=field, credits=credits, subscription=subscription,access_log=access_log,user=user,profile=profile)
        if action:
            action = ShortActionSerializer(action,context={'user':user}).data
        return {field: data[field],"credits":subscription.remaining_credits,'action':action}




class OpenedProfilesSerializer(serializers.ModelSerializer): # obsoluted as our requirements changed to calculate seniority
    candidate = CandidateProfileSerializer()
    class Meta:
        model = UserAccessLog
        fields = ['candidate']



class FavoriteCandidateSerializer(serializers.Serializer):
    candidate_profile = serializers.PrimaryKeyRelatedField(queryset=CandidateProfiles.objects.all(),required=True)





class ReturnFavoriteCandidateSerializer(serializers.ModelSerializer): # obsoluted as our requirements changed to calculate seniority
    candidate = CandidateProfileSerializer()
    
    class Meta:
        model = FavoriteCandidates
        fields = ['candidate']






class ShortCandidateProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = CandidateProfiles
        fields = ['id','first_name','last_name','current_position','company_name','person_city']



class ReportSerializer(serializers.Serializer):
    reason = serializers.ChoiceField(choices=ReportChoices.choices)
    description = serializers.CharField(required=False)
    profile = serializers.PrimaryKeyRelatedField(queryset=CandidateProfiles.objects.all(),required=True)



    def validate(self, attrs):
        validated_data =  super().validate(attrs)
        reason = validated_data.get('reason')

        if reason == ReportChoices.OTHER and not validated_data.get('description'):
            raise DotsValidationError({"description":['Please provide description.']})
        
        if not reason == ReportChoices.OTHER:
            validated_data['description'] = None

        return validated_data


    def report_profile(self,validated_data):
        user = self.context['user']
        profile = validated_data.get('profile')
        full_name = profile.full_name
        description = validated_data.get('description')
        reason = validated_data.get('reason')

        report_reasons = {
            ReportChoices.MOBILE_PHONE:'Incorrect Mobile Phone Number',
            ReportChoices.LANDLINE_PHONE:'Incorrect Landline Number',
            ReportChoices.PERSONAL_EMAIL:'Incorrect Personal Email',
            ReportChoices.PROFESSIONAL_EMAIL:'Incorrect Professional Email',
            ReportChoices.OTHER :ReportChoices.OTHER.value.title()
        }

        data = {
            'candidateData':profile,
            'report_description': description,
            'report_reason': report_reasons[reason],
            'current_user_email': user.email,
            'current_user_name':f"{user.first_name} {user.last_name}"
        }

        email_subject = f'Candidate Report Submission - {full_name}'
        text_content = email_subject
        text_template = get_template('email_templates/report-candidate-email.html')
        template_content = text_template.render(data)
        msg = EmailMultiAlternatives(email_subject, text_content, settings.EMAIL_HOST_USER, [settings.CONTACT_EMAIL_RECEIVER])
        msg.attach_alternative(template_content, 'text/html')
        msg.send()
        