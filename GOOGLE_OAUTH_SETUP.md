# Google OAuth Setup Guide

## Current Status
✅ **Admin account is working!** You can log in with:
- **Email**: `infolegalge@gmail.com`
- **Password**: `admin123456`
- **Login URL**: `http://localhost:3001/auth/signin`

## To Enable Google OAuth Login

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or **Google Identity API**)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Add authorized redirect URI: `http://localhost:3001/api/auth/callback/google`
7. Copy your **Client ID** and **Client Secret**

### Step 2: Set Environment Variables

Create a `.env.local` file in your project root with:

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_SECRET="dev-secret-key-for-development"
NEXTAUTH_URL="http://localhost:3001"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"

# Super Admin Email
SUPER_ADMIN_EMAIL="infolegalge@gmail.com"
```

### Step 3: Restart Development Server

After setting the environment variables:

```bash
npm run dev
```

### Step 4: Test Google Login

1. Go to `http://localhost:3001/auth/signin`
2. Click "Continue with Google"
3. Sign in with your Gmail account
4. The accounts will be automatically linked

## Current Working Login Methods

### Method 1: Email/Password (Always Available)
- **Email**: `infolegalge@gmail.com`
- **Password**: `admin123456`
- **URL**: `http://localhost:3001/auth/signin`

### Method 2: Google OAuth (After Setup)
- Click "Continue with Google" button
- Sign in with your Gmail account
- Automatically linked to your admin account

## Admin Panel Access

Once logged in, access the admin panel at:
- **URL**: `http://localhost:3001/ka/admin`
- **Features**: Full CMS access with SUPER_ADMIN privileges

## Troubleshooting

### If Google OAuth Still Doesn't Work:
1. Check that environment variables are set correctly
2. Verify the redirect URI in Google Console matches exactly
3. Make sure the Google+ API is enabled
4. Restart the development server after setting environment variables

### If You Can't Access Admin Panel:
1. Make sure you're logged in with `infolegalge@gmail.com`
2. Check that your role is set to `SUPER_ADMIN`
3. Try logging out and logging back in

## Quick Fix Commands

If you need to reset the admin account:

```bash
DATABASE_URL="file:./prisma/dev.db" NEXTAUTH_SECRET="dev-secret-key-for-development" npx tsx src/scripts/fix-admin-account.ts
```

To check Google OAuth status:

```bash
DATABASE_URL="file:./prisma/dev.db" NEXTAUTH_SECRET="dev-secret-key-for-development" npx tsx src/scripts/setup-google-oauth.ts
```

