from api.core.models import BaseModel
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()







class UserTokens(BaseModel):
    user = models.ForeignKey(User,on_delete=models.CASCADE,related_name='user_tokens')
    refresh_token = models.TextField()


    def __str__(self):
        return self.user.email 