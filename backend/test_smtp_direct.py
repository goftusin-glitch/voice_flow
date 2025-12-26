"""
Direct SMTP Test Script - Tests email without Flask
"""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

print("=" * 60)
print("Direct SMTP Connection Test")
print("=" * 60)

# Get configuration from .env
smtp_server = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
smtp_port = int(os.getenv('MAIL_PORT', 587))
smtp_username = os.getenv('MAIL_USERNAME')
smtp_password = os.getenv('MAIL_PASSWORD')
from_email = os.getenv('MAIL_DEFAULT_SENDER', smtp_username)
use_tls = os.getenv('MAIL_USE_TLS', 'True') == 'True'

print("\n📧 Configuration:")
print(f"   Server: {smtp_server}")
print(f"   Port: {smtp_port}")
print(f"   Username: {smtp_username}")
print(f"   Password: {'*' * 8 if smtp_password else 'NOT SET'}")
print(f"   From Email: {from_email}")
print(f"   Use TLS: {use_tls}")

if not smtp_username or not smtp_password:
    print("\n❌ ERROR: MAIL_USERNAME or MAIL_PASSWORD not set in .env")
    exit(1)

# Test email
to_email = "thiru@socialeagle.ai"

print(f"\n📨 Sending test email to: {to_email}")
print("   Please wait...")

try:
    # Create message
    message = MIMEMultipart('alternative')
    message['Subject'] = "Test Email from Voice Flow"
    message['From'] = from_email
    message['To'] = to_email

    # HTML content
    html_content = """
    <html>
    <body>
        <h2>SMTP Test Email</h2>
        <p>This is a test email from your Voice Flow application.</p>
        <p>If you received this, your SMTP configuration is working correctly!</p>
        <p><strong>Configuration tested:</strong></p>
        <ul>
            <li>Server: {server}</li>
            <li>Port: {port}</li>
            <li>Username: {username}</li>
        </ul>
    </body>
    </html>
    """.format(server=smtp_server, port=smtp_port, username=smtp_username)

    html_part = MIMEText(html_content, 'html')
    message.attach(html_part)

    # Send email
    print(f"\n🔌 Connecting to {smtp_server}:{smtp_port}...")

    with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
        print("✅ Connected to SMTP server")

        if use_tls:
            print("🔒 Starting TLS encryption...")
            context = ssl.create_default_context()
            server.starttls(context=context)
            print("✅ TLS encryption started")

        print(f"🔑 Authenticating as {smtp_username}...")
        server.login(smtp_username, smtp_password)
        print("✅ Authentication successful")

        print(f"📤 Sending email to {to_email}...")
        server.sendmail(from_email, to_email, message.as_string())
        print("✅ Email sent successfully!")

    print("\n" + "=" * 60)
    print("✅ SUCCESS! Email has been sent!")
    print("=" * 60)
    print(f"\n📬 Check your inbox at: {to_email}")
    print("   Subject: Test Email from Voice Flow")
    print("\n💡 If you don't see it:")
    print("   1. Check spam/junk folder")
    print("   2. Wait 1-2 minutes for delivery")
    print("   3. Check if the email address is correct")
    print("\n✅ Your SMTP configuration is working correctly!")

except smtplib.SMTPAuthenticationError as e:
    print("\n" + "=" * 60)
    print("❌ AUTHENTICATION ERROR")
    print("=" * 60)
    print(f"\nError: {str(e)}")
    print("\n🔍 This means your username or password is incorrect.")
    print("\n📝 For Gmail, you need an App Password:")
    print("   1. Go to: https://myaccount.google.com/apppasswords")
    print("   2. Enable 2-Factor Authentication first")
    print("   3. Generate a new App Password")
    print("   4. Copy it to MAIL_PASSWORD in .env (without spaces)")
    print("\n   Example: gvkxregtzslgkgzb (not: gvkx regt zsig kgzb)")

except smtplib.SMTPConnectError as e:
    print("\n" + "=" * 60)
    print("❌ CONNECTION ERROR")
    print("=" * 60)
    print(f"\nError: {str(e)}")
    print("\n🔍 Cannot connect to SMTP server.")
    print("\n📝 Try these solutions:")
    print("   1. Check your internet connection")
    print("   2. Verify MAIL_SERVER is correct")
    print("   3. Try port 465 with SSL instead")
    print("   4. Check firewall settings")

except smtplib.SMTPException as e:
    print("\n" + "=" * 60)
    print("❌ SMTP ERROR")
    print("=" * 60)
    print(f"\nError: {str(e)}")
    print("\n🔍 General SMTP error occurred.")

except Exception as e:
    print("\n" + "=" * 60)
    print("❌ UNEXPECTED ERROR")
    print("=" * 60)
    print(f"\nError type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    print("\n🔍 An unexpected error occurred.")
    print("   Please check your configuration and try again.")

print("\n" + "=" * 60)
