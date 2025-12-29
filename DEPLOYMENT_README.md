# 🚀 Neufin - Production Deployment Guide

> Financial Intelligence Platform with Bias Detection & Alpha Analysis

## 📋 Quick Summary of Changes

This deployment package includes critical fixes for production readiness:

### ✅ Fixed Issues
1. **Removed hardcoded URLs** - All API endpoints now use environment variables
2. **Added environment configuration** - Separate `.env` files for dev/prod
3. **Configured CORS properly** - Domain-based CORS with security headers
4. **Created Docker setup** - Docker Compose for easy deployment
5. **Added systemd/PM2 support** - Alternative deployment methods
6. **Implemented proper logging** - Production-grade error handling
7. **Security hardened** - Helmet, HTTPS enforcement, CSP headers

## 🎯 Deployment Options

### Option 1: Docker Compose (Recommended) ⭐
**Best for**: Most deployments, easier scaling

```bash
# 1. Configure environment
cp .env.example .env.production
cp backend/.env.example backend/.env.production
# Edit files with your values

# 2. Deploy
docker-compose up -d

# 3. Run migrations
docker-compose exec backend npm run migrate

# Done! 🎉
```

### Option 2: Systemd Services
**Best for**: Dedicated servers, direct control

```bash
# Requires sudo
sudo ./deploy.sh
# Choose option 2
```

### Option 3: PM2 Process Manager
**Best for**: Node.js environments, simple setup

```bash
bash deploy.sh
# Choose option 3
```

## 📝 Configuration Files

### Frontend Environment
Create `.env.production`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key
VITE_BACKEND_URL=https://api.yourdomain.com
VITE_FRONTEND_URL=https://yourdomain.com
```

### Backend Environment
Create `backend/.env`:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/neufin
REDIS_URL=redis://host:6379
SUPABASE_URL=https://your-project.supabase.co
# ... add other API keys
```

## 🔐 Security Checklist

- [ ] SSL/HTTPS enabled
- [ ] Environment variables configured
- [ ] API keys secured (not in git)
- [ ] CORS properly configured
- [ ] Supabase OAuth URLs updated
- [ ] Database password secured
- [ ] JWT secret (32+ chars) set
- [ ] Rate limiting enabled
- [ ] Security headers enabled

## 📊 System Requirements

### Minimum
- 2 CPU cores
- 2 GB RAM
- 20 GB storage
- PostgreSQL 13+
- Redis 6+

### Recommended
- 4+ CPU cores
- 4+ GB RAM
- 50 GB storage
- PostgreSQL 16
- Redis 7

## 🚀 Quick Start

1. **Prepare Server**
   ```bash
   # Install dependencies
   curl -sL https://deb.nodesource.com/setup_20.x | sudo bash -
   sudo apt-get install nodejs docker.io docker-compose nginx
   ```

2. **Clone & Configure**
   ```bash
   git clone <your-repo>
   cd Neufindesgn
   cp .env.example .env.production
   cp backend/.env.example backend/.env
   # Edit .env files with your values
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   docker-compose exec backend npm run migrate
   ```

4. **Configure Nginx**
   - See DEPLOYMENT.md for full Nginx config
   - Set reverse proxy to forward `/api/*` to backend
   - Enable SSL with Let's Encrypt

5. **Verify**
   ```bash
   curl https://yourdomain.com/api/health
   curl https://yourdomain.com
   ```

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detailed deployment guide
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Pre-flight checklist
- **[backend/README.md](./backend/README.md)** - Backend API docs
- **[src/API_DOCUMENTATION.md](./src/API_DOCUMENTATION.md)** - API reference

## 🔗 Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Health check |
| `GET /api` | API documentation |
| `GET /api/user/*` | User management |
| `GET /api/portfolio/*` | Portfolio operations |
| `GET /api/alpha/*` | Alpha analysis |
| `GET /api/stocks/*` | Stock data |
| `POST /api/chat/*` | AI chat |

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Rebuild images
docker-compose build --no-cache

# Run migrations
docker-compose exec backend npm run migrate

# Access database
docker exec -it neufin-postgres psql -U neufin -d neufin
```

## 🔄 Updates & Maintenance

### Updating Code
```bash
git pull origin main
docker-compose build
docker-compose up -d
docker-compose exec backend npm run migrate
```

### Backup Database
```bash
docker exec neufin-postgres pg_dump -U neufin neufin > backup.sql
```

### Restore Database
```bash
docker exec -i neufin-postgres psql -U neufin neufin < backup.sql
```

## 🆘 Troubleshooting

### CORS Errors
```bash
# Verify environment variable
echo $FRONTEND_URL

# Add to ADDITIONAL_ORIGINS if needed
export ADDITIONAL_ORIGINS="https://yourdomain.com"
```

### Database Errors
```bash
# Test connection
docker exec neufin-postgres psql -U neufin -c "SELECT 1"

# Check migrations
docker-compose exec backend npm run migrate:status
```

### OAuth Not Working
1. Go to Supabase Dashboard
2. Update Auth → URL Configuration
3. Set Site URL to your domain
4. Update OAuth Redirect URLs

### Performance Issues
- Check database query performance
- Monitor Redis memory usage
- Review API rate limits
- Analyze slow logs

## 📈 Monitoring & Alerts

### Health Endpoints
```bash
# Backend health
curl https://yourdomain.com/api/health

# Check via cron job every 5 minutes
*/5 * * * * curl -s https://yourdomain.com/api/health || send_alert
```

### View Logs
```bash
# Docker
docker-compose logs -f --tail=100 backend

# Systemd
journalctl -u neufin-backend -f

# PM2
pm2 logs neufin-backend
```

## 💰 Cost Optimization

- Use managed databases (AWS RDS, Azure Database) for less maintenance
- Enable caching with Redis for frequently accessed data
- Use CDN for static assets
- Implement API rate limiting
- Monitor resource usage regularly

## 🤝 Support & Resources

- **Issues**: Check GitHub Issues
- **Docs**: See `/docs` folder
- **API**: `/api` endpoint on deployed server
- **Status**: Check health endpoint

## 📄 License

MIT License - See LICENSE file

## 🎉 Next Steps

1. ✅ Configure environment variables
2. ✅ Run `docker-compose up -d`
3. ✅ Run database migrations
4. ✅ Configure Nginx/Apache
5. ✅ Set up SSL certificate
6. ✅ Update Supabase OAuth URLs
7. ✅ Configure monitoring
8. ✅ Test all endpoints
9. ✅ Celebrate! 🎊

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
