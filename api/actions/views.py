from api.actions.serializer import ActionSerializer,ReturnActionSerializer,UpdateActionSerializer
from api.core.permissions import HaveSubscribe,IsAppUser
from api.core.mixin import DotsModelViewSet
from api.actions.models import ProfileActions
from django_filters.rest_framework import DjangoFilterBackend
from api.core.action_filters import ActionListFilters
from api.core.utils import DotsValidationError







class ProfileActionsViewSet(DotsModelViewSet):
    serializer_create_class = ActionSerializer
    serializer_class = ReturnActionSerializer
    permission_classes = [HaveSubscribe]
    queryset = ProfileActions.objects.all()
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ActionListFilters
    action_serializers = {
        'update':UpdateActionSerializer
    }


    def perform_create(self, serializer):
        serializer.validated_data['created_by'] = self.request.user
        return super().perform_create(serializer)
    


    def get_queryset(self):
        if self.request.user.is_anonymous:
            return ProfileActions.objects.none()
        data =  super().get_queryset()
        user = self.request.user
        if self.action in ['destroy','update','partial_update']:
            return data.filter(created_by=user)
        users = user.get_team
        return data.filter(created_by__in=users)
    

    def get_serializer_context(self):
        data = super().get_serializer_context()
        data['user'] = self.request.user
        return data
    

    def perform_update(self, serializer):
        instance = serializer.instance
        if instance.action_type == ProfileActions.Types.OPENED_PROFILE:
            raise DotsValidationError({"action_type":['You can not update this action.']})
        return super().perform_update(serializer)
    


    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAppUser()]
        return super().get_permissions()
    