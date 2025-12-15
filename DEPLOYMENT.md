# Panduan Deployment Production - PDF Editor

Panduan lengkap untuk menjalankan aplikasi PDF Editor di lingkungan production.

## Daftar Isi

- [Persyaratan Sistem](#persyaratan-sistem)
- [Persiapan Deployment](#persiapan-deployment)
- [Deployment ke Vercel (Recommended)](#deployment-ke-vercel-recommended)
- [Deployment ke VPS/Server Sendiri](#deployment-ke-vpsserver-sendiri)
- [Deployment dengan Docker](#deployment-dengan-docker)
- [Optimasi Production](#optimasi-production)
- [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Persyaratan Sistem

### Minimum Requirements
- **Node.js**: v18.17.0 atau lebih tinggi
- **RAM**: Minimal 512MB (Recommended 1GB+)
- **Storage**: Minimal 500MB untuk aplikasi dan dependencies
- **OS**: Linux, macOS, atau Windows Server

### Dependencies Production
Semua dependencies sudah terdefinisi di `package.json`. Tidak ada environment variables yang wajib dikonfigurasi.

---

## Persiapan Deployment

### 1. Clone Repository

```bash
git clone <repository-url>
cd pdf-editor
```

### 2. Install Dependencies

```bash
npm install --production=false
```

### 3. Build Aplikasi

```bash
npm run build
```

Perintah ini akan:
- Mengompilasi TypeScript ke JavaScript
- Mengoptimasi assets (CSS, images, fonts)
- Generate static pages dan server components
- Membuat production bundle di folder `.next`

### 4. Test Production Build Locally

```bash
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`

---

## Deployment ke Vercel (Recommended)

Vercel adalah platform deployment yang dibuat oleh tim Next.js, memberikan pengalaman deployment terbaik.

### Menggunakan Vercel CLI

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login ke Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

### Menggunakan Vercel Dashboard

1. Buka [vercel.com](https://vercel.com)
2. Klik "Import Project"
3. Connect repository Git Anda (GitHub/GitLab/Bitbucket)
4. Configure project:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
5. Klik "Deploy"

### Auto-Deploy dengan Git

Setelah setup awal, setiap push ke branch `master` akan otomatis trigger deployment.

**Keuntungan Vercel:**
- Auto-scaling
- Global CDN
- SSL Certificate otomatis
- Preview deployments untuk setiap pull request
- Zero configuration
- Analytics dan monitoring built-in

---

## Deployment ke VPS/Server Sendiri

### Menggunakan PM2 (Process Manager)

PM2 adalah production process manager untuk Node.js yang akan menjaga aplikasi tetap running.

#### 1. Install PM2

```bash
npm install -g pm2
```

#### 2. Buat File Konfigurasi PM2

Buat file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'pdf-editor',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}
```

#### 3. Start Aplikasi dengan PM2

```bash
# Build terlebih dahulu
npm run build

# Start dengan PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 startup script (restart otomatis saat server reboot)
pm2 startup
```

#### 4. Monitoring dengan PM2

```bash
# Lihat status aplikasi
pm2 status

# Lihat logs real-time
pm2 logs pdf-editor

# Monitoring dashboard
pm2 monit

# Restart aplikasi
pm2 restart pdf-editor

# Stop aplikasi
pm2 stop pdf-editor
```

### Setup dengan Nginx sebagai Reverse Proxy

#### 1. Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### 2. Konfigurasi Nginx

Buat file `/etc/nginx/sites-available/pdf-editor`:

```nginx
upstream pdf_editor {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificate (gunakan Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Client Max Body Size (untuk upload PDF)
    client_max_body_size 50M;

    location / {
        proxy_pass http://pdf_editor;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location /_next/static {
        proxy_pass http://pdf_editor;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # Error pages
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

#### 3. Enable Site dan Restart Nginx

```bash
# Symlink konfigurasi
sudo ln -s /etc/nginx/sites-available/pdf-editor /etc/nginx/sites-enabled/

# Test konfigurasi
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 4. Setup SSL dengan Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Dapatkan SSL Certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal sudah dikonfigurasi otomatis
# Test renewal:
sudo certbot renew --dry-run
```

---

## Deployment dengan Docker

### 1. Buat Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Update next.config.ts

Tambahkan output standalone:

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

### 3. Buat .dockerignore

```
node_modules
.next
.git
.env*.local
npm-debug.log
README.md
.gitignore
```

### 4. Buat docker-compose.yml

```yaml
version: '3.8'

services:
  pdf-editor:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 5. Build dan Run

```bash
# Build image
docker build -t pdf-editor .

# Run container
docker run -d -p 3000:3000 --name pdf-editor pdf-editor

# Atau menggunakan docker-compose
docker-compose up -d
```

### 6. Docker Commands

```bash
# View logs
docker logs -f pdf-editor

# Restart container
docker restart pdf-editor

# Stop container
docker stop pdf-editor

# Remove container
docker rm pdf-editor

# Update aplikasi
docker-compose pull
docker-compose up -d
```

---

## Optimasi Production

### 1. Environment Variables (Opsional)

Buat file `.env.production` jika diperlukan:

```bash
# Analytics
NEXT_PUBLIC_GA_ID=your-ga-id

# API Keys (jika ada)
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### 2. Caching Strategy

Next.js sudah mengoptimasi caching secara otomatis:
- Static pages di-cache secara agresif
- Server components di-cache dengan revalidation
- Client-side navigation menggunakan prefetching

### 3. Image Optimization

Konfigurasi sudah ada di `next.config.ts`:
- AVIF dan WebP formats untuk kompresi lebih baik
- Responsive image sizes
- Lazy loading otomatis

### 4. Security Headers

Tambahkan di `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  // ... existing config
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  }
};
```

### 5. Bundle Analysis

Analisis ukuran bundle untuk optimasi:

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Update next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)

# Run analysis
ANALYZE=true npm run build
```

---

## Monitoring & Troubleshooting

### Health Check Endpoint

Buat file `app/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
}
```

### Common Issues

#### 1. Out of Memory

Increase Node.js memory limit:

```bash
# Dalam package.json
"scripts": {
  "start": "NODE_OPTIONS='--max-old-space-size=2048' next start"
}
```

#### 2. Port Already in Use

Change port:

```bash
PORT=3001 npm start
```

#### 3. Build Failures

Clear cache dan rebuild:

```bash
rm -rf .next
npm run build
```

### Logging

#### Setup Logging dengan Winston

```bash
npm install winston
```

Buat `lib/logger.ts`:

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### Performance Monitoring

Gunakan Vercel Analytics atau setup custom monitoring:

```bash
npm install @vercel/analytics
```

Update `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## Backup & Recovery

### Automated Backups

Setup cron job untuk backup (jika ada data/database):

```bash
# Edit crontab
crontab -e

# Backup setiap hari jam 2 pagi
0 2 * * * /path/to/backup-script.sh
```

### Disaster Recovery

1. Simpan konfigurasi di version control (Git)
2. Document semua environment variables
3. Backup database secara regular (jika ada)
4. Test restore process secara periodik

---

## Checklist Deployment

- [ ] Dependencies terinstall dengan benar
- [ ] Build sukses tanpa error
- [ ] Environment variables dikonfigurasi
- [ ] SSL/TLS certificate terpasang
- [ ] Firewall dikonfigurasi (port 80, 443, 22)
- [ ] Process manager (PM2) running
- [ ] Nginx reverse proxy dikonfigurasi
- [ ] Auto-restart on server reboot enabled
- [ ] Monitoring dan logging aktif
- [ ] Backup strategy disiapkan
- [ ] Domain DNS dikonfigurasi
- [ ] Security headers diterapkan
- [ ] Health check endpoint berfungsi

---

## Support & Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Vercel Deployment**: https://vercel.com/docs
- **PM2 Documentation**: https://pm2.keymetrics.io/docs
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Docker Documentation**: https://docs.docker.com/

---

## Update Aplikasi

### Update di Vercel
Push ke Git, auto-deploy akan berjalan.

### Update di VPS
```bash
git pull origin master
npm install
npm run build
pm2 restart pdf-editor
```

### Update di Docker
```bash
git pull origin master
docker-compose build
docker-compose up -d
```

---

**Catatan**: Aplikasi ini adalah client-side PDF editor yang tidak memerlukan database atau storage backend. Semua processing dilakukan di browser user, sehingga deployment lebih sederhana dan scalable.
