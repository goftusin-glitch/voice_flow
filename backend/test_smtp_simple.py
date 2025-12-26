"""Direct SMTP Test Script"""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

load_dotenv()

print("=" * 60)
print("Direct SMTP Connection Test")
print("=" * 60)

# Configuration
smtp_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
smtp_port = int(os.getenv('MAIL_PORT', 587))
smtp_username = os.getenv('MAIL_USERNAME')
smtp_password = os.getenv('MAIL_PASSWORD')
from_email = os.getenv('MAIL_DEFAULT_SENDER', smtp_username)
use_tls = os.getenv('MAIL_USE_TLS', 'True') == 'True'

print("\nConfiguration:")
print(f"   Server: {smtp_server}")
print(f"   Port: {smtp_port}")
print(f"   Username: {smtp_username}")
print(f"   Password: {'***' if smtp_password else 'NOT SET'}")
print(f"   From: {from_email}")
print(f"   TLS: {use_tls}")

if not smtp_username or not smtp_password:
    print("\nERROR: MAIL_USERNAME or MAIL_PASSWORD not set")
    exit(1)

to_email = "thiru@socialeagle.ai"
print(f"\nSending test to: {to_email}")

try:
    # Create message
    message = MIMEMultipart('alternative')
    message['Subject'] = "Test Email from Voice Flow"
    message['From'] = from_email
    message['To'] = to_email

    html = "<h2>Test Email</h2><p>SMTP is working!</p>"
    message.attach(MIMEText(html, 'html'))

    # Send
    print(f"\nConnecting to {smtp_server}:{smtp_port}...")
    with smtplib.SMTP(smtp_server, smtp_port, timeout=15) as server:
        print("Connected!")

        if use_tls:
            print("Starting TLS...")
            context = ssl.create_default_context()
            server.starttls(context=context)
            print("TLS started!")

        print(f"Authenticating as {smtp_username}...")
        server.login(smtp_username, smtp_password)
        print("Authenticated!")

        print(f"Sending to {to_email}...")
        server.sendmail(from_email, to_email, message.as_string())
        print("Sent!")

    print("\n" + "=" * 60)
    print("SUCCESS! Email sent to: " + to_email)
    print("=" * 60)
    print("\nCheck your inbox and spam folder!")

except smtplib.SMTPAuthenticationError as e:
    print("\n" + "=" * 60)
    print("AUTHENTICATION ERROR")
    print("=" * 60)
    print(f"\nError: {str(e)}")
    print("\nFor Gmail, you need an App Password:")
    print("1. Go to: https://myaccount.google.com/apppasswords")
    print("2. Enable 2FA first")
    print("3. Generate App Password")
    print("4. Update MAIL_PASSWORD in .env")

except smtplib.SMTPConnectError as e:
    print("\n" + "=" * 60)
    print("CONNECTION ERROR")
    print("=" * 60)
    print(f"\nError: {str(e)}")
    print("\nCheck internet, server, port, firewall")

except Exception as e:
    print("\n" + "=" * 60)
    print("ERROR")
    print("=" * 60)
    print(f"\nType: {type(e).__name__}")
    print(f"Message: {str(e)}")
