from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import base64
import os
from dotenv import load_dotenv

load_dotenv()

# Path to the Safaricom Public Certificate (Download from Daraja Portal)
CERTIFICATE_PATH = "certs/SandboxCertificate.cer" # Change to "production_cert.cer" when going live

# Your MPESA Initiator Password
INITIATOR_PASSWORD = os.getenv("MPESA_INITIATOR_PASSWORD")

def generate_security_credential():
    try:
        # Load the public certificate
        with open(CERTIFICATE_PATH, "r") as cert_file:
            cert_data = cert_file.read()
        
        # Extract the RSA public key
        public_key = RSA.importKey(cert_data)
        
        # Encrypt the Initiator Password
        cipher = PKCS1_v1_5.new(public_key)
        encrypted_password = cipher.encrypt(INITIATOR_PASSWORD.encode())

        # Encode in Base64
        security_credential = base64.b64encode(encrypted_password).decode()
        
        print("\nYour MPESA_B2C_SECURITY_CREDENTIAL is:\n")
        print(security_credential)
        print("\nCopy and paste it into your .env file.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_security_credential()