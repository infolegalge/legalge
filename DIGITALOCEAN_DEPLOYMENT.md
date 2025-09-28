# DigitalOcean Deployment Guide for Legal-Ge

## 🚀 Production Environment Configuration

### Google OAuth Credentials (Production)
- **Client ID**: `213069827963-ebme06hgns4ju60s815jdmvvjmnokbup.apps.googleusercontent.com`
- **Client Secret**: `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`

### Environment Variables for Production

Create a `.env.production` file on your DigitalOcean droplet:

```bash
# Google OAuth Configuration (Production)
GOOGLE_CLIENT_ID=213069827963-ebme06hgns4ju60s815jdmvvjmnokbup.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Admin Configuration
SUPER_ADMIN_EMAIL=infolegalge@gmail.com

# NextAuth Configuration (Update with your domain)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-strong-production-secret

# Database (PostgreSQL for production)
DATABASE_URL=postgresql://username:password@localhost:5432/legalge_prod

# Public URLs (Update with your domain)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_WP_BASE_URL=https://infolegalge-fcztd.wpcomstaging.com

# Email Configuration
EMAIL_USER=legalgeinbox@yahoo.com
EMAIL_PASS=contact!@#$
```

## 🗄️ Database Setup (PostgreSQL)

### 1. Install PostgreSQL
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

### 2. Create Database and User
```bash
sudo -u postgres psql
CREATE DATABASE legalge_prod;
CREATE USER legalge_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE legalge_prod TO legalge_user;
\q
```

### 3. Run Database Migrations
```bash
npx prisma migrate deploy
npx prisma generate
```

## 🌐 Domain Configuration

### 1. Update Google OAuth Settings
In Google Cloud Console, update the OAuth consent screen:
- **Authorized JavaScript origins**: `https://your-domain.com`
- **Authorized redirect URIs**: `https://your-domain.com/api/auth/callback/google`

### 2. Update Environment Variables
Replace `your-domain.com` with your actual domain in:
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`
- Google OAuth authorized domains

## 🔧 Deployment Steps

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd legalge
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Environment Variables
```bash
cp .env.production .env.local
# Edit .env.local with your actual values
```

### 4. Build Application
```bash
npm run build
```

### 5. Start Production Server
```bash
npm start
```

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Rotate secrets regularly

### 2. Database Security
- Use strong database passwords
- Restrict database access to application server only
- Enable SSL for database connections

### 3. Server Security
- Keep system packages updated
- Configure firewall (UFW)
- Use HTTPS with SSL certificates
- Set up regular backups

## 📊 Monitoring & Maintenance

### 1. Logs
```bash
# View application logs
pm2 logs legalge

# View system logs
sudo journalctl -u your-app-service
```

### 2. Database Backups
```bash
# Create backup
pg_dump legalge_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql legalge_prod < backup_file.sql
```

### 3. Updates
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Restart application
pm2 restart legalge
```

## 🚨 Troubleshooting

### Common Issues:
1. **OAuth redirect mismatch**: Check authorized domains in Google Console
2. **Database connection**: Verify DATABASE_URL and PostgreSQL service
3. **Build failures**: Check Node.js version compatibility
4. **SSL issues**: Ensure proper certificate configuration

### Useful Commands:
```bash
# Check application status
pm2 status

# View real-time logs
pm2 logs legalge --lines 100

# Restart application
pm2 restart legalge

# Check database connection
npx prisma db pull
```

## 📞 Support

For deployment issues:
- Check application logs: `pm2 logs legalge`
- Verify environment variables: `printenv | grep -E "(GOOGLE|NEXTAUTH|DATABASE)"`
- Test database connection: `npx prisma db pull`
- Verify OAuth configuration in Google Cloud Console
