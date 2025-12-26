"""
Quick Email Test Script
Run this after restarting the Flask server to test SMTP configuration
"""
import os
from dotenv import load_dotenv
from app import create_app
from app.services.email_service import EmailService

# Load environment variables
load_dotenv()

# Create Flask app context
app = create_app()

print("=" * 60)
print("SMTP Email Configuration Test")
print("=" * 60)

# Display current configuration
print("\n📧 Current Email Configuration:")
print(f"   MAIL_SERVER: {app.config.get('MAIL_SERVER')}")
print(f"   MAIL_PORT: {app.config.get('MAIL_PORT')}")
print(f"   MAIL_USE_TLS: {app.config.get('MAIL_USE_TLS')}")
print(f"   MAIL_USE_SSL: {app.config.get('MAIL_USE_SSL')}")
print(f"   MAIL_USERNAME: {app.config.get('MAIL_USERNAME')}")
print(f"   MAIL_PASSWORD: {'*' * 8 if app.config.get('MAIL_PASSWORD') else 'NOT SET'}")
print(f"   MAIL_DEFAULT_SENDER: {app.config.get('MAIL_DEFAULT_SENDER')}")

# Check if configured
if not app.config.get('MAIL_USERNAME') or not app.config.get('MAIL_PASSWORD'):
    print("\n❌ ERROR: SMTP not configured!")
    print("   Please set MAIL_USERNAME and MAIL_PASSWORD in .env file")
    exit(1)

print("\n✅ SMTP configuration found!")

# Get test email from user
test_email = input("\n📨 Enter email address to send test to (or press Enter to use your MAIL_USERNAME): ").strip()
if not test_email:
    test_email = app.config.get('MAIL_USERNAME')

print(f"\n🚀 Sending test email to: {test_email}")
print("   Please wait...")

with app.app_context():
    try:
        # Send test invitation email
        result = EmailService.send_team_invitation(
            email=test_email,
            team_name="Test Team",
            inviter_name="Email Test Script",
            invitation_link="http://localhost:5173/register?token=TEST_TOKEN_123"
        )

        print("\n" + "=" * 60)
        print("✅ SUCCESS! Test email sent successfully!")
        print("=" * 60)
        print(f"\n📬 Check your inbox at: {test_email}")
        print("   Subject: You've been invited to join Test Team on Call Analyzer")
        print("\n💡 Note: If you don't see it:")
        print("   1. Check your spam/junk folder")
        print("   2. Wait a few minutes (Gmail can be slow)")
        print("   3. Verify the email address is correct")

    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ ERROR: Failed to send test email")
        print("=" * 60)
        print(f"\nError message: {str(e)}")
        print("\n🔍 Troubleshooting:")
        print("   1. Verify your Gmail App Password is correct")
        print("   2. Make sure 2FA is enabled on your Gmail account")
        print("   3. Check if 'Less secure app access' is enabled (if not using App Password)")
        print("   4. Try generating a new App Password at: https://myaccount.google.com/apppasswords")
        print("\n📖 See SMTP_SETUP.md for detailed troubleshooting")
