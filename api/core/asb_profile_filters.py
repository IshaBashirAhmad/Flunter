import django_filters
from django.db.models import Q





class ProfilesFilterSet(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_by_profile', label='Search')

    class Meta:
        fields = []

    def filter_by_profile(self, queryset, name, value):
        return queryset.filter(
                Q(full_name__icontains=value) | 
                Q(company_name__icontains=value) | 
                Q(current_position__icontains=value) | 
                Q(email1__icontains=value) | 
                Q(phone1__icontains=value) | 
                Q(headline__icontains=value) | 
                Q(person_city__icontains=value) | 
                Q(person_skills__icontains=value)
            )