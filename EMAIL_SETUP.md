# Email Configuration Setup

## Current Status
**Email service is configured for Yahoo Mail** - Contact form submissions will be sent via Yahoo SMTP.

## Email Configuration

Add the following environment variables to your `.env.local` file:

```env
# Email Configuration for Contact Form (Yahoo Mail)
EMAIL_USER=legalgeinbox@yahoo.com
EMAIL_PASS=contact!@#$
```

## Yahoo Mail Setup

1. **Yahoo Account**: Use your regular Yahoo email and password
2. **No App Password Required**: Yahoo allows regular passwords for SMTP
3. **SMTP Service**: Configured for Yahoo's SMTP servers

## Contact Form Destination

All contact form submissions will be sent to: **legalgeinbox@yahoo.com**

## Email Features

- **HTML Email**: Formatted email with contact details and message
- **Plain Text Fallback**: Text version for email clients that don't support HTML
- **Contact Details**: Name, email, and message included
- **Timestamp**: Submission date and time
- **Source Identification**: Clearly marked as from LLC Legal Sandbox Georgia

## Security Notes

- Never commit email credentials to version control
- Use app passwords instead of your main Gmail password
- Consider using a dedicated Gmail account for business emails
