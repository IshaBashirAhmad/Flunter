from django.db import models
from api.core.models import BaseModel
from django.contrib.auth import get_user_model
from aisearchbot.models import CandidateProfiles



User = get_user_model()




class SharedProfiles(BaseModel):
    shared_from = models.ForeignKey(User,on_delete=models.CASCADE,related_name='shared_from',blank=True)
    shared_to = models.ForeignKey(User,on_delete=models.CASCADE,related_name='shared_to',blank=True)
    profile = models.ForeignKey(CandidateProfiles, on_delete=models.CASCADE,related_name='shared_profile')
    deleted_by_shared_from = models.BooleanField(default=False)
    deleted_by_shared_to = models.BooleanField(default=False)