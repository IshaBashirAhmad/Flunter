import django_filters
from api.my_lists.models import ProfileLists




class ProfileListFilterSets(django_filters.FilterSet):
    search = django_filters.CharFilter(field_name='name',lookup_expr='icontains')


    class Meta:
        model = ProfileLists
        fields = ['search']