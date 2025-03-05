def format_phone_number(phone):
    """"Ensure the phone number is in 254xxxxxxxxx format"""
    phone = phone.strip().replace(" ", "")
    if not phone.startswith("254"):
        phone = f"254{phone[-9:]}"
    return phone if len(phone) == 12 else None