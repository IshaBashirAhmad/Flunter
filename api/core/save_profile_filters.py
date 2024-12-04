import django_filters
from django.db.models import Q





class SavedProfilesFilterSets(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_by_profile', label='Search')

    class Meta:
        fields = []

    def filter_by_profile(self, queryset, name, value):
        return queryset.filter(
                Q(profile__full_name__icontains=value) | 
                Q(profile__email1__icontains=value) | 
                Q(profile__email2__icontains=value) | 
                Q(profile__company_name__icontains=value) | 
                Q(profile__headline__icontains=value) | 
                Q(profile__current_position__icontains=value) | 
                Q(profile__person_city__icontains=value) | 
                Q(profile__person_state__icontains=value) | 
                Q(profile__person_country__icontains=value) | 
                Q(profile__person_skills__icontains=value)
            )