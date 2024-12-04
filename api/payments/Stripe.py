from enum import Enum
import time
import stripe
from django.conf import settings


class StripeSource(Enum):
    CARD = "card"
    BANK = "bank_account"


class Stripe:
    stripe.api_key = settings.STRIPE_SECRET_KEY

    @staticmethod
    def create_customer(fullname: str, cust_email: str):
        success = False
        response = None

        try:
            customer_obj = stripe.Customer.create(
                email=cust_email,
                name=fullname,
            )
            success = True
            response = customer_obj.id
        except stripe.error.InvalidRequestError as ex:
            print(ex.error.message)
            response = ex.error.message
        except Exception as ex:
            print(vars(ex))
            response = "Something went wrong!\nTry again later!"
        return success, response

    @staticmethod
    def charge_payment(
        customer_id: str, receipt_email: str, amount: float, source_id: str
    ):
        charge_amount = int(amount * 100)  # stripe accepts amount as integer only
        success = False
        response = None

        try:
            stripe_customer = stripe.Customer.retrieve(customer_id)
            if stripe_customer.default_source != None:
                # use provided source id otherwise use default
                customer_source = (
                    stripe_customer.default_source if not source_id else source_id
                )

                stripe_charge = stripe.Charge.create(
                    amount=charge_amount,
                    currency=settings.STRIPE_CURRENCY,
                    customer=stripe_customer.id,
                    source=customer_source,
                    receipt_email=receipt_email,
                )
                if stripe_charge.status == "succeeded" and stripe_charge.paid:
                    success = True
                else:
                    # any other failure reason for charge
                    response = stripe_charge.failure_message
            else:
                response = "Please attach a card to proceed!"
        except stripe.error.CardError as ex:
            print(ex)
            response = ex.error.message
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            response = ex.error.message
        except Exception as ex:
            print(vars(ex))
            response = "Something went wrong while charging the card!\nTry again later!"
        return success, response

    @staticmethod
    def charge_card(card_token: str, receipt_email: str, amount: float):
        charge_amount = int(amount * 100)  # stripe accepts amount as integer only
        success = False
        response = None

        try:
            if isinstance(card_token, str) and card_token:
                stripe_charge = stripe.Charge.create(
                    amount=charge_amount,
                    currency=settings.STRIPE_CURRENCY,
                    source=card_token,
                    receipt_email=receipt_email,
                )
                if stripe_charge.status == "succeeded" and stripe_charge.paid:
                    success = True
                else:
                    # any other failure reason for charge
                    response = stripe_charge.failure_message
            else:
                response = "Empty card details!"
        except stripe.error.CardError as ex:
            print(ex)
            response = ex.error.message
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            response = ex.error.message
        except Exception as ex:
            print(vars(ex))
            response = "Something went wrong while charging the card!\nTry again later!"
        return success, response

    # returns bank object if no error found
    @staticmethod
    def verify_bank(customer_id: str, source_id: str, amounts: list):
        verified_status = "verified"
        success = False
        try:
            is_success, bank_account = Stripe.get_source(customer_id, source_id)
            if not is_success:
                return success, bank_account  # error returned from get_source

            # check if already verified
            if bank_account.status == verified_status:
                return success, "Account is already verified"

            bank_account.verify(amounts=amounts)
            # check if the account verification is successful
            if bank_account.status != verified_status:
                return success, "Couldn't verify the account, please try again later!"

            # verification is successful, return bank object
            success = True
            return success, bank_account
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while verifying the bank!\nTry again later!",
            )

    @staticmethod
    def get_source_list(customer_id: str, source_type: str, limit: int = 100):
        success = False
        try:
            source_list = stripe.Customer.list_sources(
                customer_id, object=source_type, limit=limit
            )["data"]
            success = True
            return success, source_list
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while getting the sources list!\nTry again later!",
            )

    @staticmethod
    def get_source(customer_id: str, source_id: str):
        success = False
        try:
            source = stripe.Customer.retrieve_source(customer_id, source_id)
            success = True
            return success, source
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while getting the source!\nTry again later!",
            )

    @staticmethod
    def add_source(customer_id: str, source_token: str):
        success = False
        try:
            # remove all cards before adding any other
            Stripe.remove_all_sources(customer_id, StripeSource.CARD.value)

            created_source = stripe.Customer.create_source(
                customer_id, source=source_token
            )
            success = True
            return success, created_source
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while adding the source!\nTry again later!",
            )

    @staticmethod
    def update_card(customer_id: str, source_token: str, kwargs):
        success = False
        try:
            updated_source = stripe.Customer.modify_source(
                customer_id, source_token, **kwargs
            )
            success = True
            return success, updated_source
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while updating the source!\nTry again later!",
            )

    @staticmethod
    def remove_source(customer_id: str, source_id: str):
        success = False
        try:
            removed_source = stripe.Customer.delete_source(customer_id, source_id)
            success = True
            return success, removed_source
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while removing the source!\nTry again later!",
            )

    @staticmethod
    def remove_all_sources(
        customer_id: str, source_type: str = StripeSource.CARD.value
    ):
        success, sources = Stripe.get_source_list(customer_id, source_type)
        if not success:
            return success, sources

        # remove all sources one by one
        for source in sources:
            Stripe.remove_source(customer_id, source.id)

        # return list of removed sources and success to true
        return success, sources

    @staticmethod
    def create_payment_intent(
        amount: float, customer_id: str, currency: str = "usd"
    ):
        success = False
        response = None

        try:
            payment_intent = stripe.PaymentIntent.create(
                amount=amount,
                currency=currency,
                customer=customer_id,
            )
            success = True
            response = payment_intent
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while creating the payment intent!\nTry again later!",
            )
        return success, response

    @staticmethod
    def create_payment_method(payment_method_id: str, customer: str):
        success = False
        response = None

        try:
            payment_method = stripe.PaymentMethod.attach(
                payment_method_id, customer=customer
            )
            success = True
            response = payment_method
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while creating the payment method!\nTry again later!",
            )
        return success, response

    @staticmethod
    def get_payment_method(customer_id: str, type: str):
        success = False
        response = None

        try:
            payment_method = stripe.PaymentMethod.list(customer=customer_id, type=type)[
                "data"
            ]
            success = True
            response = payment_method
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while getting the payment method!\nTry again later!",
            )
        return success, response
    
    @staticmethod
    def remove_payment_method(payment_method_id: str):
        success = False
        response = None

        try:
            payment_method = stripe.PaymentMethod.detach(payment_method_id)
            success = True
            response = payment_method
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while removing the payment method!\nTry again later!",
            )
        return success, response


    @staticmethod
    def create_subscription(customer_id: str, price_id: str):
        success = False
        response = None

        try:
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": price_id}],
                payment_behavior="default_incomplete",
                expand=["latest_invoice.payment_intent"]
            )
            success = True
            response = dict(
                subscription_id=subscription.id,
                client_secret=subscription.latest_invoice.payment_intent.client_secret
            )
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while creating the subscription!\nTry again later!",
            )
        return success, response
    
    @staticmethod
    def paused_subscription(subscription_id: str):
        success = False
        response = None

        try:
            pausedSubscription = stripe.Subscription.modify(
                subscription_id,
                pause_collection={"behavior": "mark_uncollectible"}
                )
            success = True
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while paused the subscription!\nTry again later!",
            )
        return success, response
    
    @staticmethod
    def check_subscription_expiry(subscription_id: str):
        success = False
        response = None

        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            status = subscription['status']
            current_time = int(time.time())
            period_end = subscription['current_period_end']
            if status in ['canceled', 'unpaid']:
                response = f"Subscription status is {status}."
            elif current_time > period_end:
                success = True
                response = "Subscription period has ended."
            else:
                success = False
                response = "Subscription is still active."
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while checking the subscription status! Try again later!",
            )
        return success, response

    @staticmethod
    def resume_subscription(subscription_id: str):
        success = False
        response = None

        try:
            resumedSubscription = stripe.Subscription.modify(
                subscription_id,
                pause_collection='',
                )
            success = True
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while resuming the subscription!\nTry again later!",
            )
        return success, response
    
    @staticmethod
    def cancel_subscription(subscription_id: str):
        success = False
        response = None

        try:
            deletedSubscription = stripe.Subscription.cancel(subscription_id)
            success = True
        except stripe.error.InvalidRequestError as ex:
            print(ex)
            return success, ex.error.message
        except Exception as ex:
            print(vars(ex))
            return (
                success,
                "Something went wrong while cancelling the subscription!\nTry again later!",
            )
        return success, response
    

    @staticmethod
    def cancel_payment(payment_intent, amount):
        success = False
        response = None

        try:
            cancel_payment_intent = stripe.Refund.create(
                amount=amount,
                payment_intent=payment_intent,
            )
            success = True
            response = cancel_payment_intent
        except stripe.error.InvalidRequestError as ex:
            return success, ex.error.message
        except Exception as ex:
            return (
                success,
                "Something went wrong while cancel the payment intent!\nTry again later!",
            )
        return success, response


    @staticmethod
    def default_payment_method(customer_id,payment_method_id,**kwargs):
        success = False
        response = None
        try:
            response = stripe.Customer.modify(
                customer_id,
                invoice_settings={
                    'default_payment_method': payment_method_id,
                },
                **kwargs
            )
            success = True
        except stripe.error.InvalidRequestError as ex:
            return success, ex.error.message
        except Exception as ex:
            return (
                success,
                "Something went wrong while seting the payment method!\nTry again later!",
            )
        return success, response
    

    @staticmethod
    def stripe_intent(customer,type):
        success = False
        response = None
        try:
            response = stripe.SetupIntent.create(
            customer=customer,
            payment_method_types =['card'],
            )
            success = True
        except stripe.error.InvalidRequestError as ex:
            return success, ex.error.message
        except Exception as ex:
            return (
                success,
                "Something went wrong while creating the setup intent intent!\nTry again later!",
            )
        return success, response.client_secret
    

    @staticmethod
    def retrieve_payment_method(method_id):
        success = False
        response = None
        try:
            response = stripe.PaymentMethod.retrieve(method_id)
            success = True
        except stripe.error.InvalidRequestError as ex:
            return success, ex.error.message
        except Exception as ex:
            return (
                success,
                "Something went wrong while getting the payment method!\nTry again later!",
            )
        return success, response
    

    @staticmethod
    def get_invoices(customer):
        success = False
        response = None
        try:
            response = stripe.Invoice.list(status='paid',limit=100,customer=customer)
            success = True
        except stripe.error.InvalidRequestError as ex:
            return success, ex.error.message
        except Exception as ex:
            return (
                success,
                "Something went wrong while getting the invoices!\nTry again later!",
            )
        return success, response
