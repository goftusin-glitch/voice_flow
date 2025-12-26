# SMTP Email Configuration Guide

This application uses SMTP to send emails for team invitations and report sharing. Follow this guide to configure email functionality.

## Table of Contents
- [Gmail Setup](#gmail-setup)
- [Outlook/Office 365 Setup](#outlookoffice-365-setup)
- [Other Email Providers](#other-email-providers)
- [Configuration](#configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Gmail Setup

### Option 1: Using App Password (Recommended)

1. **Enable 2-Factor Authentication**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Create App Password**
   - Visit [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Click "Generate"
   - Copy the 16-character password (remove spaces)

3. **Update .env file**
   ```env
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   MAIL_USE_SSL=False
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Your app password
   MAIL_DEFAULT_SENDER=your-email@gmail.com
   ```

### Option 2: Allow Less Secure Apps (Not Recommended)

⚠️ **Warning**: This is less secure. Use App Passwords instead.

1. Go to [Less Secure App Access](https://myaccount.google.com/lesssecureapps)
2. Turn on "Allow less secure apps"
3. Use your regular Gmail password in MAIL_PASSWORD

---

## Outlook/Office 365 Setup

### For Personal Outlook (outlook.com, hotmail.com, live.com)

1. **Update .env file**
   ```env
   MAIL_SERVER=smtp-mail.outlook.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   MAIL_USE_SSL=False
   MAIL_USERNAME=your-email@outlook.com
   MAIL_PASSWORD=your-password
   MAIL_DEFAULT_SENDER=your-email@outlook.com
   ```

2. **Enable SMTP Authentication**
   - Go to [Outlook Settings](https://outlook.live.com/mail/options/mail/accounts)
   - Make sure SMTP is enabled in your account settings

### For Office 365 Business

1. **Update .env file**
   ```env
   MAIL_SERVER=smtp.office365.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   MAIL_USE_SSL=False
   MAIL_USERNAME=your-email@yourdomain.com
   MAIL_PASSWORD=your-password
   MAIL_DEFAULT_SENDER=your-email@yourdomain.com
   ```

2. **Enable SMTP AUTH**
   - Your admin may need to enable SMTP AUTH for your organization
   - Contact your IT administrator if you encounter authentication errors

---

## Other Email Providers

### Yahoo Mail

```env
MAIL_SERVER=smtp.mail.yahoo.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_USERNAME=your-email@yahoo.com
MAIL_PASSWORD=your-app-password  # Generate at Yahoo Account Security
MAIL_DEFAULT_SENDER=your-email@yahoo.com
```

### Custom SMTP Server

For other email providers, you'll need:
- SMTP server address (e.g., smtp.yourdomain.com)
- SMTP port (usually 587 for TLS or 465 for SSL)
- Your email credentials

```env
MAIL_SERVER=smtp.yourdomain.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_USERNAME=your-email@yourdomain.com
MAIL_PASSWORD=your-password
MAIL_DEFAULT_SENDER=your-email@yourdomain.com
```

**Common SMTP Ports:**
- Port 587: TLS/STARTTLS (recommended)
- Port 465: SSL (legacy, but still works)
- Port 25: Unencrypted (not recommended, often blocked)

---

## Configuration

### Environment Variables

Add these to your `backend/.env` file:

```env
# SMTP Email Configuration
MAIL_SERVER=smtp.gmail.com          # Your SMTP server
MAIL_PORT=587                       # SMTP port (587 for TLS, 465 for SSL)
MAIL_USE_TLS=True                   # Use TLS encryption
MAIL_USE_SSL=False                  # Use SSL encryption
MAIL_USERNAME=your-email@gmail.com  # Your email address
MAIL_PASSWORD=your-app-password     # Your email password or app password
MAIL_DEFAULT_SENDER=your-email@gmail.com  # From email address
```

### Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `MAIL_SERVER` | SMTP server hostname | smtp.gmail.com |
| `MAIL_PORT` | SMTP server port | 587 |
| `MAIL_USE_TLS` | Use TLS encryption | True |
| `MAIL_USE_SSL` | Use SSL encryption | False |
| `MAIL_USERNAME` | Email account username | Required |
| `MAIL_PASSWORD` | Email account password | Required |
| `MAIL_DEFAULT_SENDER` | Default sender email | Same as MAIL_USERNAME |

---

## Testing

### Test Email Configuration

1. **Start the backend server**
   ```bash
   cd backend
   python run.py
   ```

2. **Send a test team invitation**
   - Log in to your application
   - Go to Teams page
   - Invite a team member
   - Check the console output for email status

3. **Check Console Output**
   - ✅ Success: "Email sent successfully to [email]"
   - ❌ Error: Check the error message for details

### Manual Test Script

Create a test script `test_email.py` in the backend directory:

```python
import os
from dotenv import load_dotenv
from app import create_app
from app.services.email_service import EmailService

# Load environment variables
load_dotenv()

# Create Flask app context
app = create_app()

with app.app_context():
    try:
        # Test invitation email
        EmailService.send_team_invitation(
            email="test@example.com",
            team_name="Test Team",
            inviter_name="Test User",
            invitation_link="https://example.com/invite?token=test123"
        )
        print("✅ Test email sent successfully!")
    except Exception as e:
        print(f"❌ Error sending test email: {str(e)}")
```

Run the test:
```bash
python test_email.py
```

---

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

**Error**: `SMTP Authentication Error: (535, b'5.7.8 Username and Password not accepted')`

**Solutions**:
- For Gmail: Use App Password, not your regular password
- Verify MAIL_USERNAME and MAIL_PASSWORD are correct
- Check if 2FA is enabled (required for Gmail App Passwords)
- For Office 365: Ensure SMTP AUTH is enabled

#### 2. Connection Timeout

**Error**: `SMTPServerDisconnected: Connection unexpectedly closed`

**Solutions**:
- Check MAIL_SERVER hostname is correct
- Verify MAIL_PORT (587 for TLS, 465 for SSL)
- Check firewall settings
- Try different port (587 vs 465)

#### 3. TLS/SSL Errors

**Error**: `SMTP SSL/TLS handshake failed`

**Solutions**:
- If using port 587, set `MAIL_USE_TLS=True` and `MAIL_USE_SSL=False`
- If using port 465, set `MAIL_USE_SSL=True` and `MAIL_USE_TLS=False`
- Don't enable both TLS and SSL simultaneously

#### 4. Sender Not Allowed

**Error**: `Sender address rejected`

**Solutions**:
- Ensure MAIL_DEFAULT_SENDER matches MAIL_USERNAME
- Some providers require exact match between sender and authenticated user
- Check if your email provider allows sending from different addresses

#### 5. Email Not Configured

**Console Output**: `SMTP email service not configured`

**Solution**:
- Ensure .env file exists in backend directory
- Verify MAIL_USERNAME and MAIL_PASSWORD are set
- Restart the Flask server after updating .env

---

## Security Best Practices

1. **Use App Passwords**: Never use your main email password
2. **Environment Variables**: Never commit .env file to version control
3. **Secure Credentials**: Store passwords securely, use secrets managers in production
4. **TLS Encryption**: Always use TLS (port 587) or SSL (port 465)
5. **Rate Limiting**: Implement rate limiting for email sending in production
6. **SPF/DKIM**: Configure SPF and DKIM records for custom domains

---

## Production Considerations

### Dedicated Email Service

For production, consider using:
- **SendGrid**: Professional email API service
- **Amazon SES**: Scalable email service
- **Mailgun**: Email automation platform
- **Postmark**: Transactional email service

### Configuration for Production

```env
# Production SMTP Configuration
MAIL_SERVER=smtp.yourprovider.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_USERNAME=noreply@yourdomain.com
MAIL_PASSWORD=secure-app-password
MAIL_DEFAULT_SENDER=noreply@yourdomain.com
```

### Monitoring

- Log all email sending attempts
- Monitor delivery rates
- Track bounces and failures
- Set up alerts for email service issues

---

## Support

If you continue to experience issues:

1. Check the console output for detailed error messages
2. Verify your email provider's SMTP settings
3. Test with a different email provider
4. Contact your email provider's support

For application-specific issues, check the application logs at:
```
backend/logs/app.log
```

---

## Additional Resources

- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [Outlook SMTP Settings](https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353)
- [Yahoo SMTP Settings](https://help.yahoo.com/kb/SLN4724.html)
- [Python smtplib Documentation](https://docs.python.org/3/library/smtplib.html)
