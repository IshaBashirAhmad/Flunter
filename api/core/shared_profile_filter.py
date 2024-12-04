import django_filters
from django.db.models import Q
from aisearchbot.models import LocationDetails
from api.shared_profiles.models import SharedProfiles
from datetime import datetime
from api.core.utils import DotsValidationError




def filter_by_keyword(queryset, fields, value):
    search_terms = value.split()
    conditions = Q()
    
    for term in search_terms:
        term_conditions = Q()
        for field in fields:
            term_conditions |= Q(**{f"{field}__icontains": term})
        conditions &= term_conditions

    return queryset.filter(conditions).distinct()



class SharedToFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_by_keyword')
    shared_to = django_filters.CharFilter(field_name='shared_to',lookup_expr='exact')
    start_date = django_filters.DateFilter(method='filter_created_at')
    end_date = django_filters.DateFilter(method='filter_created_at')
    city = django_filters.CharFilter(field_name='profile__person_city',lookup_expr='icontains')
    state = django_filters.CharFilter(method='filter_by_state')
    region = django_filters.CharFilter(field_name='profile__person_state',lookup_expr='icontains')


    class Meta:
        model = SharedProfiles
        fields = ['created_at'] 

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        start_date = self.data.get('start_date')
        end_date = self.data.get('end_date')
        shared_to = self.data.get('shared_to')
        shared_from = self.data.get('shared_from')

        if (shared_to or shared_from) and (shared_to == str(self.request.user.id) or shared_from == str(self.request.user.id)):
            raise DotsValidationError({"shared_to":["Please add valid user_id."]})
        
        if start_date and end_date:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
            
            if start_date_obj > end_date_obj:
                raise DotsValidationError({"start_date": ["Start date must be lower than end date"]})
        
        if start_date:
            if start_date > datetime.now().strftime('%Y-%m-%d'):
                raise DotsValidationError({"start_date": ["Future dates are not allowed please select a valid date."]})
        
        if end_date:
            if end_date > datetime.now().strftime('%Y-%m-%d'):
                raise DotsValidationError({"end_date": ["Future dates are not allowed please select a valid date."]})
    

    def filter_by_keyword(self, queryset, name, value):
        keyword_fields = [
            'profile__person_city', 'profile__person_state','profile__first_name','profile__last_name','profile__company_name'
        ]
        return filter_by_keyword(queryset, keyword_fields, value)
    

    def filter_created_at(self, queryset, name, value):
        start_date = self.data.get('start_date')
        end_date = self.data.get('end_date')
        
        if start_date and end_date and start_date == end_date:
            exact_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            return queryset.filter(created_at__date=exact_date)
        
        if start_date and end_date:
            return queryset.filter(
                created_at__date__gte=start_date, 
                created_at__date__lte=end_date
            )

        if start_date:
            return queryset.filter(created_at__date__gte=start_date)
        if end_date:
            return queryset.filter(created_at__date__lte=end_date)
        
        return queryset
    

    def filter_by_location(self, queryset, field, value):
        location_data = LocationDetails.objects.filter(**{f'{field}__iexact': value}).values_list('region_name', flat=True).distinct()
        if location_data:
            query = Q()
            for region in location_data:
                query |= Q(profile__person_state__iexact=region)
            return queryset.filter(query)
        return queryset.none()

    def filter_by_state(self, queryset, name, value):
        return self.filter_by_location(queryset, 'department_name', value)

    



class SharedProfileFromFilter(SharedToFilter):
    shared_to = None
    shared_from = django_filters.CharFilter(field_name='shared_from',lookup_expr='exact')