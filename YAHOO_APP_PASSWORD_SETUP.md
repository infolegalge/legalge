# Yahoo App Password Setup

## 🔐 Setting up Yahoo App Password

### Step 1: Enable 2-Factor Authentication
1. Go to [Yahoo Account Security](https://login.yahoo.com/account/security)
2. Sign in with your Yahoo account
3. Enable "Two-step verification" if not already enabled

### Step 2: Generate App Password
1. In the same security page, look for "App passwords"
2. Click "Generate app password"
3. Choose "Other" and name it "Legal-Ge Contact Form"
4. Copy the generated 16-character password

### Step 3: Update Environment Variables
Replace your current password in `.env.local`:

```bash
EMAIL_USER=legalgeinbox@yahoo.com
EMAIL_PASS=your-16-character-app-password-here
```

### Step 4: Restart Server
```bash
npm run dev
```

## 🔄 Alternative: Wait for Auto-Unlock
- Yahoo typically unlocks accounts after 15-30 minutes
- No action needed, just wait and try again later

## 📧 Test Email Configuration
Once unlocked or app password is set:
1. Go to `http://localhost:3002/en/contact`
2. Fill out the contact form
3. Submit and check `legalgeinbox@yahoo.com` inbox

## 🆘 If Still Having Issues
Consider switching to Gmail with App Password:
- More reliable for SMTP
- Better documentation
- Similar setup process
