from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from api.core.mixin import DotsModelViewSet
from api.core.utils import DotsValidationError
from api.payments.serializers import ReturnStripeCardSerializer, StripeCardCreateRequestSerializer, StripeCardRequestSerializer, StripeCardUpdateSerializer
from api.payments.Stripe import Stripe, StripeSource


class PaymentCardViewSets(DotsModelViewSet):
    serializer_class = ReturnStripeCardSerializer
    serializer_create_class = StripeCardCreateRequestSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer_create(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(stripe_id=request.user.stripe_id)
        return Response(self.get_serializer(instance, many=False).data)

    def update(self, request, pk, *args, **kwargs):
        success, instance = Stripe.get_source(request.user.stripe_id, pk)
        if not success:
            raise DotsValidationError(instance)
        serializer = self.get_serializer(instance=instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(self.serializer_class(instance, many=False).data)

    def list(self, request, *args, **kwargs):
        success, sources = Stripe.get_source_list(self.request.user.stripe_id, StripeSource.CARD.value)
        if not success:
            raise DotsValidationError(sources)       # sources will contain error
        return Response(self.get_serializer(sources, many=True).data)

    def destroy(self, request, pk, *args, **kwargs):
        success, instance = Stripe.remove_source(request.user.stripe_id, pk)
        if not success:
            raise DotsValidationError(instance)
        return Response({'message': "Card removed successfully"})
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return StripeCardUpdateSerializer
        elif self.action == 'destroy':
            return StripeCardRequestSerializer
        return super().get_serializer_class()
