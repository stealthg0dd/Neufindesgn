# Production Readiness Checklist

## Pre-Deployment

### Environment Configuration
- [ ] `.env.production` created with all required variables
- [ ] `VITE_BACKEND_URL` set to production API domain
- [ ] `VITE_FRONTEND_URL` set to production frontend domain
- [ ] All API keys obtained and added:
  - [ ] Supabase credentials
  - [ ] OpenAI API key
  - [ ] Finnhub API key
  - [ ] Alpha Vantage API key
  - [ ] Stripe API keys
  - [ ] Plaid credentials
- [ ] JWT_SECRET set to strong random value (min 32 chars)
- [ ] Database credentials configured
- [ ] Redis credentials configured

### Code Quality
- [ ] Run `npm run build` successfully in both frontend and backend
- [ ] Run backend TypeScript check: `npm run typecheck`
- [ ] No console.log statements in production code (use proper logging)
- [ ] All hardcoded URLs removed (use apiConfig.ts)
- [ ] Error handling implemented properly

### Security
- [ ] CORS headers properly configured for domain
- [ ] Helmet security headers enabled
- [ ] Environment variables not exposed in client code
- [ ] Authentication tokens handled securely
- [ ] Rate limiting configured
- [ ] HTTPS enforced with redirect from HTTP

### Supabase Configuration
- [ ] OAuth redirect URLs updated
  - [ ] Google: `https://yourdomain.com/auth/callback`
  - [ ] Supabase Site URL: `https://yourdomain.com`
- [ ] API key permissions reviewed
- [ ] Row-level security (RLS) policies checked
- [ ] Auth providers enabled and configured

### Database
- [ ] PostgreSQL 16+ installed
- [ ] Database backups configured
- [ ] Migration scripts tested on staging
- [ ] Database connection pooling configured
- [ ] Indexes created on frequently queried columns

### Infrastructure
- [ ] Domain DNS configured to point to server
- [ ] SSL certificate obtained and installed
- [ ] Nginx/Apache reverse proxy configured
- [ ] Firewall rules configured
  - [ ] Port 443 (HTTPS) open
  - [ ] Port 80 (HTTP) open for redirect
  - [ ] Port 3001 (backend) internal only
  - [ ] Port 3000 (frontend) internal only
- [ ] Redis configured with persistent storage
- [ ] PostgreSQL configured with backups

### Monitoring & Logging
- [ ] Application logging configured
- [ ] Log rotation configured
- [ ] Health check endpoints working
- [ ] Monitoring/alerting set up
- [ ] Error tracking enabled (Sentry, etc.)

## Deployment Steps

### Docker Deployment
```bash
# 1. Build images
docker-compose build

# 2. Start services
docker-compose up -d

# 3. Run migrations
docker exec neufin-backend npm run migrate

# 4. Verify health
curl https://yourdomain.com/api/health
```

### Manual Deployment
```bash
# 1. Build backend
cd backend
npm ci --only=production
npm run build

# 2. Build frontend
cd ..
npm ci --only=production
npm run build:prod

# 3. Start services
pm2 start dist/server.js --name neufin-backend
serve -s dist -l 3000 > /dev/null 2>&1 &

# 4. Run migrations
npm run migrate
```

## Post-Deployment Verification

### Functionality Tests
- [ ] Frontend loads at `https://yourdomain.com`
- [ ] API health endpoint responds: `GET /api/health`
- [ ] API documentation loads: `GET /api`
- [ ] Login page displays correctly
- [ ] Google OAuth can be initiated
- [ ] Static assets load (CSS, JS, images)
- [ ] Console has no errors (dev tools)
- [ ] Network requests show correct API domain

### API Tests
```bash
# Health check
curl https://yourdomain.com/api/health

# API docs
curl https://yourdomain.com/api

# Test CORS
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: GET" \
     https://yourdomain.com/api/health
```

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks (check memory usage over time)
- [ ] CSS and JS properly minified
- [ ] Images optimized
- [ ] No unused dependencies

### Security Tests
- [ ] HTTPS redirect works
- [ ] HSTS header present
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set
- [ ] CSP header configured
- [ ] No sensitive data in source maps
- [ ] Environment variables not accessible

### Database Tests
- [ ] Connection pool working
- [ ] Queries performing within SLA
- [ ] Backup process working
- [ ] Database migrations completed

### Monitoring Tests
- [ ] Logs being collected
- [ ] Errors being tracked
- [ ] Health checks passing
- [ ] Alerts triggering properly

## Rollback Procedure

### If Issues Occur

```bash
# Stop current deployment
docker-compose down
# or
pm2 stop all

# Restore previous version
git checkout <previous-commit>
docker-compose build
docker-compose up -d

# or manually
npm ci
npm run build
pm2 restart neufin-backend
```

## Known Issues & Fixes

### CORS Errors
**Issue**: Requests blocked due to CORS
**Fix**: Verify FRONTEND_URL in .env matches domain

### Database Connection Failures
**Issue**: Cannot connect to PostgreSQL
**Fix**: Check DATABASE_URL format and network connectivity

### OAuth Redirect Loop
**Issue**: Stuck on auth callback
**Fix**: Update Supabase OAuth redirect URLs

### Static Assets Not Loading
**Issue**: CSS/JS 404 errors
**Fix**: Check build output and Nginx asset path configuration

### WebSocket Connection Failed
**Issue**: Real-time features not working
**Fix**: Ensure WebSocket upgrade headers configured in proxy

## Performance Optimization

### Frontend
- [ ] Enable gzip compression in Nginx
- [ ] Configure CDN for static assets
- [ ] Enable browser caching
- [ ] Code splitting implemented
- [ ] Lazy loading for routes

### Backend
- [ ] Database query optimization
- [ ] Response caching with Redis
- [ ] API rate limiting
- [ ] Request/response compression
- [ ] Connection pooling tuned

### Infrastructure
- [ ] Load balancer for multiple instances
- [ ] Auto-scaling configured
- [ ] Database replication (if needed)
- [ ] Redis persistence

## Ongoing Maintenance

### Daily
- [ ] Monitor error logs
- [ ] Check health endpoints
- [ ] Verify database size

### Weekly
- [ ] Review performance metrics
- [ ] Update dependencies (if needed)
- [ ] Test backup restoration

### Monthly
- [ ] Full security audit
- [ ] Performance benchmarking
- [ ] Cost optimization review
- [ ] Disaster recovery test

## Contacts & Resources

- **Supabase Status**: https://status.supabase.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Redis Docs**: https://redis.io/documentation
- **Node.js Docs**: https://nodejs.org/docs/

## Support

For issues during deployment:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Test API endpoints directly
4. Check Supabase dashboard
5. Review database migrations
