import django_filters
from api.saved_searches.models import Searches
from django.db.models import Q




class SavedSearchesFilterSets(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_by_filters', label='Search')


    class Meta:
        model = Searches
        fields = ['search']



    def filter_by_filters(self, queryset, name, value):
        return queryset.filter(
                Q(state__icontains=value) | 
                Q(city__icontains=value) | 
                Q(country__icontains=value) | 
                Q(keywords__icontains=value) | 
                Q(user__first_name__icontains=value)
            )