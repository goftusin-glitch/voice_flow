"""Verify SMTP configuration is loaded in Flask"""
from app import create_app

app = create_app()

print("=" * 60)
print("Flask SMTP Configuration Check")
print("=" * 60)

with app.app_context():
    print("\nSMTP Settings loaded in Flask:")
    print(f"  MAIL_SERVER: {app.config.get('MAIL_SERVER')}")
    print(f"  MAIL_PORT: {app.config.get('MAIL_PORT')}")
    print(f"  MAIL_USE_TLS: {app.config.get('MAIL_USE_TLS')}")
    print(f"  MAIL_USERNAME: {app.config.get('MAIL_USERNAME')}")
    print(f"  MAIL_PASSWORD: {'***' if app.config.get('MAIL_PASSWORD') else 'NOT SET'}")

    if app.config.get('MAIL_USERNAME') and app.config.get('MAIL_PASSWORD'):
        print("\n✅ SMTP IS CONFIGURED!")
        print("   Emails will be sent when you use the app.")
    else:
        print("\n❌ SMTP NOT CONFIGURED!")
        print("   Check your .env file.")
