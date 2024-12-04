from django.conf import settings

def api_base_url(request):
    return {'API_BASE_URL': settings.API_URL}
