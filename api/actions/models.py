from django.db import models
from api.core.models import BaseModel
from aisearchbot.models import CandidateProfiles
from django.utils.translation import gettext as _
from django.contrib.auth import get_user_model

User = get_user_model()






class ProfileActions(BaseModel):
    class Types(models.TextChoices):
        CALL = 'call', _('call')
        TEXT_MESSAGE = 'text_message', _('text messages')
        VOICE_EMAIL = 'voice_email', _('voice email')
        EMAIL = 'email', _('email')
        NOTE = 'note', _('note')
        CONVERT = 'convert', _('convert')
        OPENED_PROFILE = 'opened_profile'
    
    action_type = models.CharField(max_length=100, choices=Types.choices)
    created_by = models.ForeignKey(User,on_delete=models.CASCADE,blank=True)
    profile = models.ForeignKey(CandidateProfiles, on_delete=models.CASCADE,related_name='profile_actions')
    comment = models.TextField()
    action_datetime = models.DateTimeField()