from django.db.models import F, Value, Case, When, Q, IntegerField, FloatField, Count


def get_percentage(self,queryset):
    master_keyword = self.request.query_params.get('keyword')
    job_title_keywords = self.request.query_params.get('current_position')
    skills = self.request.query_params.get('person_skills')

    if job_title_keywords:
        job_title_keywords = job_title_keywords.split(',')
    else:
        job_title_keywords = []

    if skills:
        skills = skills.split(',')
    else:
        skills = []

    if not job_title_keywords or not skills or not master_keyword:
        return queryset.annotate(
            percentage=(Value(100))
        )
    

    return queryset.annotate(
            master_keyword_match=Case(
                When(Q(headline__icontains=master_keyword) | Q(current_position__icontains=master_keyword),
                    then=Value(50)
                ),
                default=Value(20),
                output_field=IntegerField()
            ),
            
            job_title_match_count=Case(
                *[
                    When(
                        Q(headline__icontains=keyword) | Q(current_position__icontains=keyword),
                        then=Value(1)
                    ) for keyword in job_title_keywords
                ],
                default=Value(15),
                output_field=IntegerField()
            ),
            
            job_title_points=Case(
                When(job_title_match_count=1, then=Value(30)),
                When(job_title_match_count=2, then=Value(35)),
                When(job_title_match_count__gte=3, then=Value(40)),
                default=Value(10),
                output_field=IntegerField()
            ),
            
            skills_match=Case(
                When(
                    Q(
                        *[Q(headline__icontains=skill) | Q(current_position__icontains=skill) for skill in skills]
                    ),
                    then=Value(15)
                ),
                default=Value(5),
                output_field=IntegerField()
            ),
            
            percentage=(
                Value(0) +
                F('master_keyword_match') +
                F('job_title_points') +
                F('skills_match')
            )
        )