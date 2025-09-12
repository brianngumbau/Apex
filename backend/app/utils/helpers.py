
import re

def format_phone_number(phone: str) -> str | None:
    """
    Ensure the phone number is in valid Kenyan format: 2547XXXXXXXX or 2541XXXXXXXX
    Returns formatted phone number (254XXXXXXXXX) or None if invalid.
    """
    if not phone:
        return None

    # remove spaces and leading "+"
    phone = phone.strip().replace(" ", "").lstrip("+")

    # if it starts with, replace with 254
    if phone.startswith("0") and len(phone) == 10:
        phone = "254" + phone[1:]

    # if it doesn’t start with 254, take last 9 digits
    elif not phone.startswith("254"):
        phone = f"254{phone[-9:]}"

    # validate using regex: must be 12 digits, start with 2547 or 2541
    if re.fullmatch(r"254(7\d{8}|1\d{8})", phone):
        return phone

    return None