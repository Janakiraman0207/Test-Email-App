from twilio.rest import Client
from fastapi_app.core.config import settings

client = Client(
    settings.TWILIO_ACCOUNT_SID,
    settings.TWILIO_AUTH_TOKEN
)

from twilio.base.exceptions import TwilioRestException

def send_otp_sms(mobile_number, otp):
    try:
        message = client.messages.create(
            body=f"Your OTP is {otp}. Valid for 5 minutes.",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=mobile_number
        )
        return message.sid
    except TwilioRestException as e:
        print("Twilio Error:", e)
        return None
