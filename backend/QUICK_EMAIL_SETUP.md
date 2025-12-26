# Quick Email Setup Guide

## Gmail (Recommended for Development)

### 1. Enable 2-Factor Authentication
Visit: https://myaccount.google.com/security

### 2. Generate App Password
Visit: https://myaccount.google.com/apppasswords
- Select "Mail" → Generate
- Copy the 16-character password

### 3. Update .env File
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
MAIL_DEFAULT_SENDER=your-email@gmail.com
```

### 4. Restart Server
```bash
python run.py
```

---

## Outlook/Hotmail

### Update .env File
```env
MAIL_SERVER=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
MAIL_DEFAULT_SENDER=your-email@outlook.com
```

---

## Testing

### Send Test Invitation
1. Start the backend: `python run.py`
2. Login to application
3. Go to Teams → Invite Member
4. Check console for: "Email sent successfully to [email]"

### Console Messages
- ✅ **Success**: "Email sent successfully to test@example.com"
- ⚠️ **Not Configured**: "SMTP email service not configured"
- ❌ **Error**: Check error message for details

---

## Common Issues

### Authentication Error
- Gmail: Use App Password, not regular password
- Outlook: Verify credentials
- Check MAIL_USERNAME and MAIL_PASSWORD

### Connection Timeout
- Verify MAIL_SERVER hostname
- Check MAIL_PORT (587 for TLS)
- Check firewall settings

### TLS/SSL Error
- Port 587: Use TLS (MAIL_USE_TLS=True, MAIL_USE_SSL=False)
- Port 465: Use SSL (MAIL_USE_SSL=True, MAIL_USE_TLS=False)

---

## Need More Help?

See detailed guide: [SMTP_SETUP.md](./SMTP_SETUP.md)
