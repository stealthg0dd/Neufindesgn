# Deployment Guide for Neufin

## Overview
This guide covers deploying Neufin to a production domain. The application consists of:
- **Frontend**: React + Vite (served via Node/serve or CDN)
- **Backend**: Express.js API server
- **Database**: PostgreSQL
- **Cache**: Redis
- **Auth**: Supabase

## Prerequisites

1. **Domain**: Your production domain (e.g., yourdomain.com)
2. **Server**: Linux server with Docker and Docker Compose installed
3. **SSL Certificate**: Valid HTTPS certificate (Let's Encrypt recommended)
4. **Services**:
   - PostgreSQL 16+
   - Redis 7+
   - Node.js 20+ (or Docker)

## Quick Start - Docker Compose

### Step 1: Prepare Environment Files

```bash
# Copy example files
cp .env.example .env.production.local
cp backend/.env.example backend/.env.production

# Edit with your values
nano .env.production.local
nano backend/.env.production
```

Required variables to set:
- `FRONTEND_URL=https://yourdomain.com`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (strong random string, min 32 chars)
- `OPENAI_API_KEY`, `FINNHUB_API_KEY`, etc.

### Step 2: Build and Deploy

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Run database migrations
docker exec neufin-backend npm run migrate

# Check health
docker-compose ps
curl http://localhost:3001/health
curl http://localhost:3000
```

### Step 3: Configure Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/neufin
upstream backend {
    server localhost:3001;
}

upstream frontend {
    server localhost:3000;
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
    
    # SSL certificates (obtained via Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # API proxy
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend/socket.io/;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    gzip_min_length 1000;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/neufin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 4: SSL Certificate Setup

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

## Manual Deployment (Without Docker)

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run migrations
npm run migrate

# Start with PM2 (recommended for production)
npm install -g pm2
pm2 start dist/server.js --name neufin-backend --env production
pm2 save
```

### Frontend Setup

```bash
# Build
npm run build

# Install serve
npm install -g serve

# Start
serve -s dist -l 3000

# Or with PM2
pm2 start "serve -s dist -l 3000" --name neufin-frontend --env production
```

## Database Migrations

### Running migrations on production:

```bash
# Using Docker
docker exec neufin-backend npm run migrate

# Or manually
cd backend
npm run migrate -- --env production
```

## Environment Variables Reference

### Frontend (.env.production)
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_BACKEND_URL=https://api.yourdomain.com  # or /api if same domain
VITE_FRONTEND_URL=https://yourdomain.com
VITE_ENABLE_DEMO=false
VITE_LOG_LEVEL=error
```

### Backend (.env)
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:password@host:5432/neufin
REDIS_URL=redis://redis-host:6379
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
JWT_SECRET=secure-random-string-min-32-chars
FINNHUB_API_KEY=your-key
ALPHA_VANTAGE_API_KEY=your-key
OPENAI_API_KEY=your-key
STRIPE_SECRET_KEY=your-key
PLAID_CLIENT_ID=your-client-id
PLAID_SECRET=your-secret
PLAID_ENV=production
```

## Supabase Configuration

### Update OAuth Redirect URLs

1. Go to Supabase Dashboard → Authentication → Providers
2. Update Google OAuth redirect URI to: `https://yourdomain.com/auth/callback`
3. Update Site URL to: `https://yourdomain.com`
4. Add additional redirect URLs if needed

### Update Auth Settings

1. Go to Authentication → URL Configuration
2. Set:
   - **Site URL**: `https://yourdomain.com`
   - **Redirect URLs**: `https://yourdomain.com/auth/callback`

## Health Checks & Monitoring

```bash
# Check backend health
curl https://yourdomain.com/api/health

# Check API docs
curl https://yourdomain.com/api

# View logs (Docker)
docker-compose logs -f backend
docker-compose logs -f frontend

# View logs (PM2)
pm2 logs neufin-backend
pm2 logs neufin-frontend
```

## Production Checklist

- [ ] Domain configured and DNS pointing to server
- [ ] SSL certificate installed and renewing
- [ ] Environment variables set correctly
- [ ] Database backups configured
- [ ] Redis persistence enabled
- [ ] Supabase OAuth redirects updated
- [ ] All API keys configured
- [ ] Firewall rules configured
- [ ] Monitoring and alerting set up
- [ ] Database migrations completed
- [ ] Cache warmed up
- [ ] Load balancer configured (if needed)
- [ ] CDN configured for static assets (optional)

## Troubleshooting

### CORS Errors
```bash
# Add frontend URL to ADDITIONAL_ORIGINS
export ADDITIONAL_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

### Database Connection Issues
```bash
# Test connection
docker exec neufin-postgres psql -U neufin -d neufin -c "SELECT 1"
```

### Redis Connection Issues
```bash
# Test connection
docker exec neufin-redis redis-cli ping
```

### OAuth Redirect Errors
- Verify Supabase Site URL matches domain
- Check OAuth redirect URIs in Supabase and Google Cloud
- Clear browser cache and cookies

## Monitoring & Maintenance

```bash
# System resources
docker stats

# Database size
docker exec neufin-postgres du -sh /var/lib/postgresql/data

# Clean old logs
docker system prune -a --volumes

# Backup database
docker exec neufin-postgres pg_dump -U neufin neufin > backup.sql

# Restore database
docker exec -i neufin-postgres psql -U neufin neufin < backup.sql
```

## Scaling

For high-traffic environments:
- Use managed PostgreSQL (AWS RDS, Azure Database)
- Use managed Redis (AWS ElastiCache)
- Deploy multiple backend instances behind load balancer
- Use CDN for static assets
- Implement API rate limiting (already configured)
- Set up monitoring and auto-scaling

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Test API endpoints directly
4. Check Supabase dashboard
5. Review database migration status
