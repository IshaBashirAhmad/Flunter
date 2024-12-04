from django.db import models
from api.core.models import BaseModel
from django.contrib.auth import get_user_model
from django.utils.translation import gettext as _
from aisearchbot.models import CandidateProfiles



User = get_user_model()




class ProfileLists(BaseModel):
    class Types(models.TextChoices):
        RECRUITMENT = 'recruitment', _('Recruitment')
        PROSPECTION = 'prospection', _('Prospection')


    created_by = models.ForeignKey(User,on_delete=models.CASCADE,blank=True)
    name = models.CharField(max_length=100)
    list_type = models.CharField(choices=Types.choices,max_length=20,default=Types.RECRUITMENT.value)




class SavedProfilesLists(BaseModel):
    list = models.ForeignKey(ProfileLists,on_delete=models.CASCADE,related_name='profile_lists')
    profile = models.ForeignKey(CandidateProfiles,on_delete=models.CASCADE)