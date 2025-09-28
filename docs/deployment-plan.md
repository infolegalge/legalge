# Deployment Plan for Next.js Application

**Detected Stack**: PACKAGE_MANAGER=npm • DB_TYPE=sqlite • AUTH=next-auth (Google & Credentials) • NEXT_RUNTIME=node

---

## 1. Checklist with Stop/Go Gates

1. **Gate 1 – Droplet Bootstrap**
   - Provision Ubuntu 22.04 droplet (≥2 GB RAM preferred).
   - Run bootstrap script (see §2).
   - Verify `node -v`, `nginx -t`, `sudo ufw status`.

2. **Gate 2 – DNS & TLS Prereqs**
   - Point `DOMAIN`/`www.DOMAIN` to droplet IP.
   - Confirm with `dig +short DOMAIN`.

3. **Gate 3 – Repo & Secrets Prep**
   - Create `/srv/APP_NAME` directories (§3).
   - Fill `/srv/APP_NAME/shared/.env.production` (§4).
   - Check permissions with `ls -al /srv/APP_NAME/shared/.env.production`.

4. **Gate 4 – Code Adjustments**
   - Apply changes in §5.
   - Run `npm run lint && npm run build` locally.

5. **Gate 5 – Database & Storage**
   - Confirm SQLite path `/srv/APP_NAME/shared/storage/app.sqlite` exists.
   - Verify with `sqlite3 ... '.tables'`.

6. **Gate 6 – First Deployment**
   - Clone repo, install, build (§8).
   - Run Prisma migrate/generate.
   - Symlink `current`, start service (§10).
   - Check `sudo systemctl status APP_NAME` and `curl -fsS http://127.0.0.1:3000/`.

7. **Gate 7 – Reverse Proxy & TLS**
   - Install nginx block (§9), enable, reload.
   - Run Certbot, then `curl -I https://DOMAIN`.

8. **Gate 8 – CI/CD**
   - Deploy script (§11) and GitHub Actions (§12).
   - Run pipeline once; confirm zero downtime.

9. **Gate 9 – Monitoring & Security**
   - Configure logs, UFW, remove default nginx site (§15).
   - Verify `curl -fsS https://DOMAIN/health`.

---

## 2. Droplet Bootstrap Script

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_USER=deploy
APP_NAME=<your-app-name>
NODE_VERSION=20

apt-get update -y
apt-get upgrade -y
timedatectl set-timezone UTC

id -u "$APP_USER" &>/dev/null || adduser --disabled-password --gecos "" "$APP_USER"
usermod -aG sudo "$APP_USER"

if [ -f /root/.ssh/authorized_keys ]; then
  mkdir -p /home/$APP_USER/.ssh
  cp /root/.ssh/authorized_keys /home/$APP_USER/.ssh/
  chown -R $APP_USER:$APP_USER /home/$APP_USER/.ssh
  chmod 700 /home/$APP_USER/.ssh
  chmod 600 /home/$APP_USER/.ssh/authorized_keys
fi

apt-get install -y ufw fail2ban
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
systemctl enable --now fail2ban

MEM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
if [ "$MEM_KB" -lt 2097152 ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
fi

apt-get install -y build-essential git curl gnupg2 ca-certificates lsb-release nginx certbot python3-certbot-nginx sqlite3
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g npm@latest

loginctl enable-linger "$APP_USER"
apt-get autoremove -y
apt-get clean

echo "Bootstrap complete."
node -v
npm -v
nginx -t
ufw status
```

---

## 3. Directory Layout & Permissions

```
/srv/APP_NAME/
├── current -> /srv/APP_NAME/releases/TIMESTAMP
├── releases/
│   └── TIMESTAMP/
├── shared/
│   ├── .env.production
│   └── storage/app.sqlite
/var/log/APP_NAME/
```

Commands:

```bash
APP_NAME=<your-app-name>
APP_USER=deploy

mkdir -p /srv/$APP_NAME/{releases,shared/storage}
mkdir -p /var/log/$APP_NAME
mkdir -p /srv/$APP_NAME/shared/uploads
touch /srv/$APP_NAME/shared/.env.production
touch /srv/$APP_NAME/shared/storage/app.sqlite

chown -R $APP_USER:$APP_USER /srv/$APP_NAME /var/log/$APP_NAME
chmod 750 /srv/$APP_NAME /srv/$APP_NAME/{releases,shared}
chmod 640 /srv/$APP_NAME/shared/.env.production
chmod 660 /srv/$APP_NAME/shared/storage/app.sqlite
```

---

## 4. Environment Planning

### Required Variables

| Variable | Purpose | Example | Stage | Visibility |
| -------- | ------- | ------- | ----- | ---------- |
| `NEXT_PUBLIC_SITE_URL` | Public base URL | `https://<example.com>` | Build & Runtime | Public |
| `NEXTAUTH_URL` | NextAuth base | `https://<example.com>` | Build & Runtime | Secret |
| `NEXTAUTH_SECRET` | Session JWT secret | `generated-secret` | Runtime | Secret |
| `GOOGLE_CLIENT_ID` | OAuth client | `xxxx.apps.googleusercontent.com` | Runtime | Secret |
| `GOOGLE_CLIENT_SECRET` | OAuth secret | `xxxx` | Runtime | Secret |
| `DATABASE_URL` | SQLite path | `file:/srv/<APP_NAME>/shared/storage/app.sqlite` | Build & Runtime | Secret |
| `CREDENTIALS_AUTH_PASSWORD_SALT` | (Optional) credentials hashing | `random-salt` | Runtime | Secret |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Email provider (if used) | `smtp.example.com` | Runtime | Secret |
| `UPLOAD_DIR` | Local uploads dir | `/srv/<APP_NAME>/shared/uploads` | Runtime | Secret |
| `LOG_LEVEL` | Logging level | `info` | Runtime | Public |
| `NODE_ENV` | Environment flag | `production` | Build & Runtime | Public |

### `.env.production` Template

```
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://<example.com>

NEXTAUTH_URL=https://<example.com>
NEXTAUTH_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

DATABASE_URL=file:/srv/<your-app-name>/shared/storage/app.sqlite

CREDENTIALS_AUTH_PASSWORD_SALT=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

UPLOAD_DIR=/srv/<your-app-name>/shared/uploads
LOG_LEVEL=info
```

Keep `.env.production` outside git (ensure `.gitignore` covers it). `.env.local` can keep dev credentials.

---

## 5. Codebase Adjustments

1. **`next.config.js`**
   ```diff
   module.exports = {
-    reactStrictMode: true,
-  };
+    reactStrictMode: true,
+    output: 'standalone',
+  };
   ```

2. **Image Domains**
   ```diff
   images: {
-    domains: ['localhost'],
+    domains: ['localhost', '<example.com>'],
   },
   ```

3. **Env-based URLs**
   ```ts
   const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
   const apiUrl = `${BASE_URL}/api/...`;
   ```

4. **Cookie Security** for NextAuth sessions (inside NextAuth options):
   ```ts
   cookies: {
     sessionToken: {
       name: process.env.NODE_ENV === 'production'
         ? '__Secure-next-auth.session-token'
         : 'next-auth.session-token',
       options: {
         httpOnly: true,
         sameSite: 'lax',
         path: '/',
         secure: process.env.NODE_ENV === 'production',
         domain: process.env.NODE_ENV === 'production' ? '<example.com>' : undefined,
       },
     },
   },
   ```

5. **Prisma** already references `env('DATABASE_URL')`; ensure production env points to shared SQLite (or switch to managed DB if scaling).

6. **Logging**: configure server logs to use `console.log` / `pino` with `LOG_LEVEL` so systemd captures to `/var/log/APP_NAME`.

---

## 6. Database (SQLite)

- Production file: `/srv/APP_NAME/shared/storage/app.sqlite`.
- Commands in deploy:
  ```bash
  npm exec prisma generate
  npm exec prisma migrate deploy
  ```
- Optional seed: `npm exec prisma db seed`.
- Backups via cron:
  ```
  0 2 * * * sqlite3 /srv/<APP_NAME>/shared/storage/app.sqlite ".backup '/srv/<APP_NAME>/shared/backups/app-$(date +\%F).sqlite'"
  ```
  Add cleanup script to keep last 14 backups.

---

## 7. Redis (Not Required)

`REDIS_URL` absent; no action. If added later, install Redis or configure managed service, set env, run `redis-cli PING`.

---

## 8. Build & Run Procedure

```bash
APP_NAME=<your-app-name>
APP_DIR=/srv/$APP_NAME
RELEASES=$APP_DIR/releases
TIMESTAMP=$(date +%Y%m%d%H%M%S)
REPO_URL=<git-https-or-ssh-url>
BRANCH=main

mkdir -p $RELEASES/$TIMESTAMP
cd $RELEASES/$TIMESTAMP
git clone --depth=1 --branch $BRANCH $REPO_URL .
npm ci --omit=dev
NODE_ENV=production npm run build

# For standalone output
cp -r .next/standalone ./standalone
cp -r public ./standalone/public
cp -r .next/static ./standalone/.next/static

ln -sfn $RELEASES/$TIMESTAMP $APP_DIR/current
```

---

## 9. Nginx & TLS Configuration

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name <example.com> www.<example.com>;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name <example.com>;

    ssl_certificate /etc/letsencrypt/live/<example.com>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<example.com>/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/<example.com>/chain.pem;

    include snippets/ssl-params.conf;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    location /_next/static/ {
        alias /srv/<your-app-name>/current/.next/static/;
        immutable;
        access_log off;
        expires 1y;
    }

    location /public/ {
        alias /srv/<your-app-name>/current/public/;
        access_log off;
        expires 30d;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }
}
```

Enable site, remove default, reload nginx. Obtain cert:

```bash
sudo certbot --nginx -d <example.com> -d www.<example.com>
sudo systemctl reload nginx
curl -I https://<example.com>
```

---

## 10. Process Supervision (systemd)

`/etc/systemd/system/<your-app-name>.service`

```ini
[Unit]
Description=<your-app-name> Next.js service
After=network.target

[Service]
User=deploy
Group=deploy
WorkingDirectory=/srv/<your-app-name>/current
EnvironmentFile=/srv/<your-app-name>/shared/.env.production
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
StandardOutput=append:/var/log/<your-app-name>/app.log
StandardError=append:/var/log/<your-app-name>/app-error.log

[Install]
WantedBy=multi-user.target
```

Ensure `server.js` bootstraps standalone bundle. Commands:

```bash
sudo systemctl daemon-reload
sudo systemctl enable <your-app-name>
sudo systemctl start <your-app-name>
sudo systemctl status <your-app-name>
journalctl -u <your-app-name> -f
```

### PM2 Alternative

`ecosystem.config.js`

```js
module.exports = {
  apps: [
    {
      name: '<your-app-name>',
      script: './standalone/server.js',
      cwd: '/srv/<your-app-name>/current',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        NEXTAUTH_URL: 'https://<example.com>',
      },
    },
  ],
};
```

Run: `pm2 start ecosystem.config.js && pm2 save && pm2 startup systemd`.

---

## 11. Zero-Downtime Deploy Script

`/srv/<your-app-name>/deploy.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

APP_NAME=<your-app-name>
APP_DIR=/srv/$APP_NAME
RELEASES=$APP_DIR/releases
SHARED=$APP_DIR/shared
REPO_URL=<git-https-or-ssh-url>
BRANCH=main
TIMESTAMP=$(date +%Y%m%d%H%M%S)
RELEASE_DIR=$RELEASES/$TIMESTAMP
NODE_ENV=production

log() { echo "[$(date --iso-8601=seconds)] $*"; }

log "Creating release directory $RELEASE_DIR"
mkdir -p "$RELEASE_DIR"
cd "$RELEASE_DIR"
git clone --depth=1 --branch "$BRANCH" "$REPO_URL" .
npm ci --omit=dev
npm run build

log "Running Prisma"
npm exec prisma generate
npm exec prisma migrate deploy

log "Linking shared assets"
ln -sfn $SHARED/.env.production .env.production
mkdir -p $SHARED/uploads
ln -sfn $SHARED/uploads public/uploads
ln -sfn $SHARED/storage/app.sqlite prisma/app.sqlite || true

log "Updating current symlink"
ln -sfn "$RELEASE_DIR" "$APP_DIR/current"

log "Restarting service"
sudo systemctl restart $APP_NAME
sleep 5
sudo systemctl status $APP_NAME --no-pager

log "Health check"
curl -fsS https://<example.com>/ || {
  log "Health check failed, rolling back"
  PREVIOUS=$(ls -1 $RELEASES | sort | tail -n 2 | head -n 1)
  ln -sfn $RELEASES/$PREVIOUS $APP_DIR/current
  sudo systemctl restart $APP_NAME
  exit 1
}

log "Deploy completed"
```

Make executable: `chmod +x /srv/<your-app-name>/deploy.sh`.

---

## 12. CI Pipeline (GitHub Actions)

`.github/workflows/deploy.yml`

```yaml
name: Deploy Production

on:
  push:
    branches: [ main ]

jobs:
  build-test-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci
      - run: npm run typecheck --if-present
      - run: npm test --if-present
      - run: npm run build
        env:
          NEXT_PUBLIC_SITE_URL: https://<example.com>
          NEXTAUTH_URL: https://<example.com>
          NEXTAUTH_SECRET: dummy-secret
          DATABASE_URL: file:./prisma/dev.db

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DROPLET_HOST }}
          username: deploy
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /srv/<your-app-name>
            ./deploy.sh
```

Set secrets `DROPLET_HOST`, `DEPLOY_SSH_KEY`.

---

## 13. Static Assets & Uploads

- Uploads stored in `/srv/<APP_NAME>/shared/uploads`.
- Symlink `public/uploads` to shared folder during deploy (see script).
- For S3-compatible storage, add:

```
STORAGE=s3
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_BUCKET=<bucket>
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_REGION=nyc3
```

S3 client snippet:

```ts
import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});
```

---

## 14. Monitoring & Logs

- Tail app: `journalctl -u <your-app-name> -f`
- Tail nginx: `sudo tail -f /var/log/nginx/<your-app-name>-access.log`
- Logrotate example `/etc/logrotate.d/<your-app-name>`:

```
/var/log/<your-app-name>/app*.log {
  weekly
  rotate 8
  compress
  missingok
  notifempty
  create 640 deploy deploy
  postrotate
    systemctl reload <your-app-name> >/dev/null 2>&1 || true
  endscript
}
```

- Uptime check: `curl -fsS https://<example.com>/health`.

---

## 15. Security Notes

- Confirm UFW: `sudo ufw status`.
- Keep Node updated: rerun NodeSource script or `sudo apt-get install --only-upgrade nodejs`.
- Remove default nginx site: `sudo rm /etc/nginx/sites-enabled/default`.
- Optional API rate limiting:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=5r/s;

location /api/ {
  limit_req zone=api_limit burst=10 nodelay;
  proxy_pass http://127.0.0.1:3000;
  # headers...
}
```

---

## 16. Troubleshooting

| Problem | Symptom | Resolution |
| ------- | ------- | ---------- |
| 502 Bad Gateway | nginx cannot reach app | `sudo systemctl status <APP_NAME>`, check logs, ensure app listening on 3000 |
| Missing env var | Build/runtime crash | Ensure `.env.production` complete; reload service |
| Prisma migration lock | `database is locked` | Stop app briefly or use `.backup`; remove lock file if safe |
| OAuth callback mismatch | Provider error | Set `NEXTAUTH_URL` to production HTTPS and update provider console |
| Next Image 404 | External domain blocked | Update `next.config.js` images.domains |
| Port conflict | `listen EADDRINUSE` | Stop stray Node processes, check `lsof -i :3000` |

---

## 17. Rollback Plan

```bash
APP_NAME=<your-app-name>
cd /srv/$APP_NAME/releases
PREVIOUS=$(ls -1 | sort | tail -n 2 | head -n 1)
ln -sfn /srv/$APP_NAME/releases/$PREVIOUS /srv/$APP_NAME/current
sudo systemctl restart $APP_NAME
sudo systemctl status $APP_NAME
```

Verify with `curl -fsS https://<example.com>/`.

---

## 18. Quickstart Summary

```bash
# Run bootstrap script as root (from §2)
# Switch to deploy user
sudo -iu deploy

# Prepare directories & env
APP_NAME=<your-app-name>
mkdir -p /srv/$APP_NAME/shared/storage /srv/$APP_NAME/shared/uploads
nano /srv/$APP_NAME/shared/.env.production  # fill template

# First deploy
cd /srv/$APP_NAME
./deploy.sh

# Enable service & SSL
sudo systemctl enable <your-app-name>
sudo systemctl start <your-app-name>
sudo certbot --nginx -d <example.com> -d www.<example.com>

# Verify
curl -fsS https://<example.com>/
```

This document captures the full end-to-end process for deploying the Next.js project on a fresh Ubuntu 22.04 droplet.
