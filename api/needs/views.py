from api.core.mixin import GenericDotsViewSet,CreateDotsModelMixin,ListModelMixin,DestroyDotsModelMixin
from api.needs.serializer import NeedsSerializer
from rest_framework.permissions import IsAuthenticated
from api.needs.models import Needs







class NeedsViewsets(GenericDotsViewSet,CreateDotsModelMixin,ListModelMixin,DestroyDotsModelMixin):
    permission_classes = [IsAuthenticated]
    serializer_create_class = NeedsSerializer
    serializer_class = NeedsSerializer
    queryset = Needs.objects.all()


    def perform_create(self, serializer):
        serializer.validated_data['created_by'] = self.request.user
        return super().perform_create(serializer)
    
    
    def get_queryset(self):
        data = super().get_queryset()
        if self.request.user.is_anonymous:
            return data.none()
        return data.filter(created_by=self.request.user)