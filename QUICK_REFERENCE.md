# 🚀 Quick Deployment Reference

## ⚡ 5-Minute Quick Start

### 1. Configure
```bash
cp .env.example .env.production
cp backend/.env.example backend/.env
# Edit both files with your values
```

### 2. Deploy
```bash
docker-compose up -d
```

### 3. Migrate
```bash
docker-compose exec backend npm run migrate
```

### 4. Verify
```bash
curl http://localhost:3001/health  # Should return 200 OK
curl http://localhost:3000         # Should load frontend
```

## 📋 Essential Configuration

| Variable | Example | Where |
|----------|---------|-------|
| `VITE_FRONTEND_URL` | `https://yourdomain.com` | `.env.production` |
| `VITE_BACKEND_URL` | `https://api.yourdomain.com` | `.env.production` |
| `FRONTEND_URL` | `https://yourdomain.com` | `backend/.env` |
| `DATABASE_URL` | `postgresql://user:pass@host/neufin` | `backend/.env` |
| `REDIS_URL` | `redis://host:6379` | `backend/.env` |
| `JWT_SECRET` | (32+ random chars) | `backend/.env` |
| `SUPABASE_URL` | (from dashboard) | Both |
| `OPENAI_API_KEY` | (from OpenAI) | `backend/.env` |

## 🐳 Docker Commands

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop
docker-compose down

# Rebuild
docker-compose build --no-cache

# Run migration
docker-compose exec backend npm run migrate

# Database access
docker exec -it neufin-postgres psql -U neufin -d neufin
```

## 🔐 Supabase Setup

1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication → URL Configuration**
4. Set **Site URL**: `https://yourdomain.com`
5. Add **Redirect URLs**: `https://yourdomain.com/auth/callback`
6. Go to **Providers** (Google, GitHub, etc.)
7. Add Redirect URL: `https://yourdomain.com/auth/callback`

## 🌐 Nginx Configuration

```nginx
# /etc/nginx/sites-available/neufin
upstream backend {
    server localhost:3001;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 📊 Health Checks

```bash
# Backend health
curl https://yourdomain.com/api/health

# API documentation
curl https://yourdomain.com/api

# Frontend loads
curl https://yourdomain.com

# Database connected
docker exec neufin-postgres psql -U neufin -c "SELECT 1"

# Redis connected
docker exec neufin-redis redis-cli ping
```

## 🔧 Troubleshooting

### CORS Issues
```bash
# Check frontend URL in backend env
grep FRONTEND_URL backend/.env

# Should match your domain
```

### 404 on API
```bash
# Verify backend is running
docker ps | grep neufin-backend

# Check logs
docker-compose logs backend
```

### Database Connection Failed
```bash
# Check DATABASE_URL format
grep DATABASE_URL backend/.env

# Test connection
docker exec neufin-postgres psql -U neufin -c "SELECT 1"
```

### OAuth Loop
1. Clear browser cookies
2. Verify Supabase OAuth URLs
3. Check redirect URL in backend

## 📈 Monitoring

```bash
# System stats
docker stats

# Log tail
docker-compose logs -f --tail=100 backend

# Database size
docker exec neufin-postgres du -sh /var/lib/postgresql/data

# Backup
docker exec neufin-postgres pg_dump -U neufin neufin > backup.sql
```

## 🔄 Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Run new migrations
docker-compose exec backend npm run migrate
```

## 🆘 Emergency Procedures

### Rollback to Previous Version
```bash
git checkout <previous-commit>
docker-compose build
docker-compose up -d
docker-compose exec backend npm run migrate
```

### Restore from Backup
```bash
docker exec -i neufin-postgres psql -U neufin neufin < backup.sql
```

### Clear Cache
```bash
docker exec neufin-redis redis-cli FLUSHALL
```

## 📞 Key Resources

- **Full Guide**: See `DEPLOYMENT.md`
- **Checklist**: See `PRODUCTION_CHECKLIST.md`
- **Issues**: Check application logs
- **Supabase**: https://supabase.com
- **PostgreSQL**: https://www.postgresql.org
- **Docker**: https://www.docker.com

---

**Status**: ✅ Production Ready
**Last Updated**: December 2024
