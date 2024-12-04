import django_filters
from django.db.models import Q
from aisearchbot.models import CandidateProfiles, LocationDetails
from api.needs.models import ContactTypes
from api.core.models import PercentageChoices
from aisearchbot.priorities import boolean_search
from aisearchbot.views import is_advanced_search, validate_query
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




class CandidateProfileFilters(django_filters.FilterSet):
    full_name = django_filters.CharFilter(lookup_expr='icontains')
    company_name = django_filters.CharFilter(method='filter_by_companies')
    person_skills = django_filters.CharFilter(method='filter_by_skills')
    current_position = django_filters.CharFilter(method='filter_by_position')
    employee_headcount = django_filters.CharFilter(method='filter_by_employee_headcount')
    is_email1 = django_filters.BooleanFilter(method='filter_by_condition')
    is_email2 = django_filters.BooleanFilter(method='filter_by_condition')
    is_phone1 = django_filters.BooleanFilter(method='filter_by_condition')
    is_phone2 = django_filters.BooleanFilter(method='filter_by_condition')
    condition = django_filters.ChoiceFilter(method='filter_by_condition', choices=[('and', 'AND'), ('or', 'OR')])
    keyword = django_filters.CharFilter(method='filter_by_keyword')
    region = django_filters.CharFilter(method='filter_by_region')
    city = django_filters.CharFilter(method='filter_by_city')  
    state = django_filters.CharFilter(method='filter_by_state')
    seniority = django_filters.CharFilter(method='filter_by_seniority')
    contact = django_filters.ChoiceFilter(method='filter_by_contact',choices=ContactTypes.choices)
    percentage = django_filters.ChoiceFilter(method='filter_by_percentage',choices=PercentageChoices.choices)

    
    class Meta:
        model = CandidateProfiles
        fields = [
            'company_name',
            'person_skills',
            'current_position',
            'full_name',
            'is_email1',
            'is_email2',
            'is_phone1',
            'is_phone2',
            'condition',
            'contact',
        ]
        


    def filter_by_companies(self, queryset, name, value):
        company_list = value.split(',')
        query = Q()
        for company in company_list:
            query |= Q(company_name__icontains=company.strip()) 
        return queryset.filter(query)
    
    def filter_by_percentage(self,queryset,name,value):
        if value == PercentageChoices.GREATER_THAN_90:
            return queryset.filter(percentage__gte=90)
        elif value == PercentageChoices.GREATER_THAN_80:
            return queryset.filter(percentage__gte=80)
        elif value == PercentageChoices.GREATER_THAN_60:
            return queryset.filter(percentage__gte=60)
        else:
            return queryset
    
    def filter_by_seniority(self,queryset,name,value):
        seniorities = value.split(',')
        query = Q()
        for seniority in seniorities:
            query |= Q(seniority__iexact=seniority.strip())
        return queryset.filter(query)
    
    def filter_by_employee_headcount(self, queryset, name, value):
        headcount_ranges = value.split(',')
        conditions = Q()

        for headcount in headcount_ranges:
            headcount = headcount.strip() 
            
            if headcount == '0-10':
                conditions |= Q(company_size_to__lte=10)
            elif headcount == '11-50':
                conditions |= Q(company_size_from__gte=11, company_size_to__lte=50)
            elif headcount == '51-200':
                conditions |= Q(company_size_from__gte=51, company_size_to__lte=200)
            elif headcount == '201-500':
                conditions |= Q(company_size_from__gte=201, company_size_to__lte=500)
            elif headcount == '501-1000':
                conditions |= Q(company_size_from__gte=501, company_size_to__lte=1000)
            elif headcount == '1001-5000':
                conditions |= Q(company_size_from__gte=1001, company_size_to__lte=5000)
            elif headcount == '5001-10000':
                conditions |= Q(company_size_from__gte=5001, company_size_to__lte=10000)
            elif headcount == '10000':
                conditions |= Q(company_size_from__gte=10000)

        if conditions:
            return queryset.filter(conditions)
        return queryset
    
    def filter_by_position(self, queryset, name, value):
        company_list = value.split(',')
        query = Q()
        for company in company_list:
            query |= Q(current_position__icontains=company.strip()) 
        return queryset.filter(query)

    def filter_by_skills(self, queryset, name, value):
        search_values = value.split(',')
        return queryset.filter(queryset.model.objects.case_insensitive_skills_search(search_values))
    

    def filter_by_condition(self, queryset, name, value):
        contact_details = ['email1', 'email2', 'phone1', 'phone2']
        field_mapping = {
            'email1': 'email1',
            'email2': 'email2',
            'phone1': 'phone1',
            'phone2': 'phone2'
        }
        operation = self.data.get('condition', 'or')
        query = Q()
        for field in contact_details:
            user_input = self.data.get(f'is_{field}', False)
            if user_input and user_input == 'true':
                q = Q(**{f"{field_mapping[field]}__isnull": False}) & ~Q(**{f"{field_mapping[field]}": ''})
                if operation == 'or':
                    query |= q  
                elif operation == 'and':
                    query &= q
        if query:
            queryset = queryset.filter(query)
        return queryset

    
    
    def filter_by_keyword(self, queryset, name, value):
        keyword_fields = [
            'full_name', 'first_name', 'last_name', 'headline', 'current_position',
            'company_name', 'person_industry', 'tags', 'person_skills', 'education_experience',
            'previous_position_2', 'previous_position_3'
        ]
        bool_search = is_advanced_search(value)
        if bool_search:
            is_valid, error_message = validate_query(value)
            if not is_valid:
                raise DotsValidationError({"keywords":[error_message]})
            query = boolean_search(value,keyword_fields)
        return queryset.filter(query) if bool_search else filter_by_keyword(queryset, keyword_fields, value)
    

    def filter_by_location(self, queryset, field, value):
        location_data = LocationDetails.objects.filter(**{f'{field}__iexact': value}).values_list('region_name', flat=True).distinct()
        if location_data:
            query = Q()
            for region in location_data:
                query |= Q(person_state__iexact=region)

        return query if location_data else Q()

    def filter_by_state(self, queryset, name, value):
        states = value.split(',')
        query = Q()
        for state in states:
            query |= self.filter_by_location(queryset, 'department_name', state)
        return queryset.filter(query) if query else queryset.none()
    
    def filter_by_city_region(self, queryset, field_name, values):
        filters = Q()
        for value in values.split(','):
            filters |= Q(**{f"{field_name}__iexact": value})
        return queryset.filter(filters)

    def filter_by_city(self, queryset, name, value):
        return self.filter_by_city_region(queryset, 'person_city', value)

    def filter_by_region(self, queryset, name, value):
        return self.filter_by_city_region(queryset, 'person_state', value)

    def filter_by_contact(self,queryset,name,value):
        phone_only = Q(phone2__isnull=False) | Q(phone1__isnull=False)
        email_only = Q(email1__isnull=False) | Q(email2__isnull=False)
        phone_or_email = phone_only | email_only
        if value == ContactTypes.PHONE_ONLY:
            return queryset.filter(phone_only)
        elif value == ContactTypes.EMAIL_ONLY:
            return queryset.filter(email_only)
        else:
            return queryset.filter(phone_or_email)




class GenericCanidateProfileFilters(django_filters.FilterSet):
    search = django_filters.CharFilter(method='filter_by_candidate', label='Search')
    seniority = django_filters.CharFilter(method='filter_by_seniority')


    class Meta:
        fields = []

    def filter_by_candidate(self, queryset, name, value):
        return queryset.filter(
                Q(full_name__icontains=value) | 
                Q(email1__icontains=value) | 
                Q(email2__icontains=value) | 
                Q(company_name__icontains=value) | 
                Q(headline__icontains=value) | 
                Q(current_position__icontains=value) | 
                Q(person_city__icontains=value) | 
                Q(person_state__icontains=value) | 
                Q(person_country__icontains=value) | 
                Q(person_skills__icontains=value)
            )
    

    def filter_by_seniority(self,queryset,name,value):
        seniorities = value.split(',')
        query = Q()
        for seniority in seniorities:
            query |= Q(seniority__iexact=seniority.strip())
        return queryset.filter(query)