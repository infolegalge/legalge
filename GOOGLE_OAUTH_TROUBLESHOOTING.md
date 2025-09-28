# Google OAuth "Access Blocked" Troubleshooting Guide

## 🚨 Problem: "Access Blocked" When Using Google OAuth

This error typically occurs due to configuration issues in Google Cloud Console. Here's how to fix it:

**Note:** The project name is `legal-ge-local` (not "university-chain").

## 🔧 Step-by-Step Fix

### Step 1: Verify Redirect URI

The most common cause is a mismatch in the redirect URI.

**Required Redirect URI:**
```
http://localhost:3001/api/auth/callback/google
```

**How to fix:**
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Click on your OAuth 2.0 Client ID
5. In **Authorized redirect URIs**, add:
   ```
   http://localhost:3001/api/auth/callback/google
   ```
6. Click **Save**

### Step 2: Configure OAuth Consent Screen

**For Testing/Development:**
1. Go to **APIs & Services** → **OAuth consent screen**
2. Make sure the app is in **Testing** mode
3. Add **Test users**:
   - `infolegalge@gmail.com`
4. Save changes

**For Production:**
1. Set app status to **Production**
2. Verify your domain (if applicable)
3. Complete all required fields

### Step 3: Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search for and enable:
   - **Google+ API** (or **Google Identity API**)
   - **People API** (if needed)

### Step 4: Check App Domain

**For localhost (development):**
- Should work automatically
- No domain verification needed

**For production:**
- Verify your domain in Google Console
- Add your production domain to authorized domains

## 🔍 Common Error Messages & Solutions

### "Error 400: redirect_uri_mismatch"
**Solution:** Add the exact redirect URI to Google Console:
```
http://localhost:3001/api/auth/callback/google
```

### "Error 403: access_denied"
**Solution:** 
- Check OAuth consent screen configuration
- Add your email as a test user
- Ensure the app is in Testing mode

### "Error 403: app_not_verified"
**Solution:**
- For development: Keep app in Testing mode
- For production: Complete app verification process

### "Error 400: invalid_client"
**Solution:**
- Check that Client ID and Client Secret are correct
- Ensure they match the ones in Google Console

## 🛠️ Quick Fix Checklist

- [ ] Redirect URI added to Google Console
- [ ] OAuth consent screen configured
- [ ] Test user added (`infolegalge@gmail.com`)
- [ ] Required APIs enabled
- [ ] Environment variables set correctly
- [ ] Development server restarted

## 🔄 Test the Fix

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Go to the sign-in page:**
   ```
   http://localhost:3001/auth/signin
   ```

3. **Click "Continue with Google"**

4. **Sign in with your Gmail account**

## 📋 Current Configuration

**Your Google OAuth Credentials:**
- **Client ID:** `213069827963-ebme06hgns4ju60s815jdmvvjmnokbup.apps.googleusercontent.com`
- **Client Secret:** `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`
- **Redirect URI:** `http://localhost:3001/api/auth/callback/google`
- **Project Name:** `legal-ge-local`

## 🆘 If Still Not Working

### Alternative: Use Email/Password Login
You can always use the email/password method:
- **Email:** `infolegalge@gmail.com`
- **Password:** `admin123456`
- **URL:** `http://localhost:3001/auth/signin`

### Debug Steps:
1. Check browser console for detailed error messages
2. Verify environment variables are loaded
3. Test with a different Google account
4. Check Google Console for any error logs

## 🎯 Expected Result

After fixing the configuration, you should be able to:
1. Click "Continue with Google"
2. See Google's OAuth consent screen
3. Sign in with your Gmail account
4. Be redirected back to your app
5. Have full admin access to the CMS

## 📞 Need Help?

If you're still having issues, the most common fix is adding the exact redirect URI to Google Console. Make sure there are no extra spaces or characters in the URI.

