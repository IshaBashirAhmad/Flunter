from api.core.models import GlobalResponseMessages,CustomResponse
from rest_framework import status






class ResponseMessage(GlobalResponseMessages):
    user_already_exists = CustomResponse(4009, "User already exists!", status.HTTP_409_CONFLICT)
    invalid_otp_type = CustomResponse(4010, "Invalid otp type!", status.HTTP_400_BAD_REQUEST)
    otp_already_used = CustomResponse(4011, "OTP is already used!", status.HTTP_401_UNAUTHORIZED)
    otp_expired = CustomResponse(4012, "OTP expired!", status.HTTP_401_UNAUTHORIZED)
    wrong_otp_code = CustomResponse(4013, "OTP code is not correct!", status.HTTP_401_UNAUTHORIZED)
    verification_token_expired = CustomResponse(4005, "Token expired!", status.HTTP_401_UNAUTHORIZED)