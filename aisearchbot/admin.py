from django.contrib import admin
from . models import SavedListProfiles, SavedLists, Need,CandidateProfiles,DuplicateProfiles,LocationDetails
# Register your models here.

admin.site.register(SavedListProfiles)
admin.site.register(SavedLists)
admin.site.register(Need)
admin.site.register(LocationDetails)
admin.site.register(CandidateProfiles)
admin.site.register(DuplicateProfiles)
