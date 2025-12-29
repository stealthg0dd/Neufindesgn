# Railway & Vercel Deployment Guide

## 🔴 Issue Fixed: Package Registry Error

**Error:** `npm error 404 Not Found - GET https://registry.npmjs.org/@jsr%2fsupabase__supabase-js`

**Root Cause:** The package.json had an incorrect JSR (JavaScript Registry) package format entry that doesn't exist in npm registry.

**Solution Applied:**
- ✅ Removed `@jsr/supabase__supabase-js@^2.49.8` from package.json
- ✅ Kept correct `@supabase/supabase-js@^2` dependency
- ✅ Removed JSR alias from vite.config.ts

---

## 🚀 Railway Backend Deployment

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository connected to Railway
- Environment variables configured

### Step 1: Configure Environment Variables

In Railway Dashboard → Project Settings → Environment Variables, add:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:password@host/neufin
REDIS_URL=redis://host:6379
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-strong-secret-key
FRONTEND_URL=https://your-vercel-domain.vercel.app
FINNHUB_API_KEY=your-key
ALPHA_VANTAGE_API_KEY=your-key
OPENAI_API_KEY=your-key
STRIPE_SECRET_KEY=your-key
PLAID_CLIENT_ID=your-id
PLAID_SECRET=your-secret
```

### Step 2: Add Railway Configuration Files

Create `railway.json` in project root:

```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "cd backend && npm install && npm run build"
  },
  "start": "node backend/dist/server.js"
}
```

Or create `Procfile`:

```
web: cd backend && npm install && npm run build && node dist/server.js
```

### Step 3: Configure Railway Build

In Railway Dashboard:
1. Go to Settings
2. Set Build Command: `npm --prefix backend install && npm --prefix backend run build`
3. Set Start Command: `node backend/dist/server.js`
4. Set Working Directory: (leave empty)

### Step 4: Deploy

Push to GitHub:
```bash
git add .
git commit -m "Fix: Remove JSR package, fix npm dependencies"
git push origin main
```

Railway will automatically:
- Pull latest code
- Install dependencies
- Run build
- Start the server

### Step 5: Run Migrations

After first deployment:

```bash
railway run npm --prefix backend run migrate
```

Or connect to database and run manually:
```sql
-- In Railway PostgreSQL dashboard
-- Run migration scripts
```

---

## 🚀 Vercel Frontend Deployment

### Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository connected
- Environment variables configured

### Step 1: Configure Environment Variables

In Vercel Project Settings → Environment Variables, add:

```env
VITE_BACKEND_URL=https://your-railway-backend-url.railway.app
VITE_FRONTEND_URL=https://your-vercel-domain.vercel.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_ENABLE_DEMO=false
VITE_LOG_LEVEL=error
```

### Step 2: Create `vercel.json`

Create `vercel.json` in project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_BACKEND_URL": "@vite_backend_url",
    "VITE_FRONTEND_URL": "@vite_frontend_url",
    "VITE_SUPABASE_URL": "@vite_supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@vite_supabase_anon_key",
    "VITE_SUPABASE_PROJECT_ID": "@vite_supabase_project_id"
  }
}
```

### Step 3: Update Build Settings

In Vercel Project Settings:
1. **Build Command**: `npm run build`
2. **Output Directory**: `dist`
3. **Install Command**: `npm install` (default)

### Step 4: Deploy

Push to GitHub:
```bash
git add .
git commit -m "Fix: Remove JSR package, fix npm dependencies"
git push origin main
```

Vercel will automatically:
- Install dependencies
- Build React app
- Deploy to Vercel edge network
- Add your domain

### Step 5: Verify Deployment

```bash
# Check frontend
curl https://your-vercel-domain.vercel.app

# Check if API calls work
curl https://your-vercel-domain.vercel.app/api
```

---

## 🔗 Connect Railway & Vercel

### 1. Get Railway Backend URL

In Railway Dashboard:
- Go to your backend service
- Click "View Logs" dropdown
- Find public URL (e.g., `your-app-production-xxx.railway.app`)

### 2. Update Vercel Environment

In Vercel Project Settings:
- Set `VITE_BACKEND_URL=https://your-app-production-xxx.railway.app`
- Redeploy (push to GitHub)

### 3. Update Railway CORS

In Railway Environment Variables:
- Set `FRONTEND_URL=https://your-vercel-domain.vercel.app`
- Trigger redeploy

### 4. Test Connection

Frontend to Backend:
```bash
curl https://your-vercel-domain.vercel.app/api/health
# Should return 200 OK with health status
```

---

## 📊 Architecture on Railway + Vercel

```
                    Vercel Edge Network
                    (Frontend Deployment)
                            ↓
                  yourdomain.vercel.app
                    (React + Vite)
                            ↓
                    API Calls (HTTPS)
                            ↓
                    Railway Backend
                  your-app-production-xxx.railway.app
                     (Express.js API)
                            ↓
            ┌───────────────┼───────────────┐
            ↓               ↓               ↓
        PostgreSQL      Redis Cache    External APIs
        (Railway)       (Railway)    (OpenAI, Finnhub, etc)
```

---

## 🆘 Troubleshooting

### Railway Build Fails: "npm install" exits with code 1

**Solution:** The JSR package issue is fixed. Redeploy with:
```bash
git add .
git commit -m "Fix npm dependencies"
git push origin main
```

### Vercel Build Fails: Package not found

**Solution:** Same as above. The package.json has been corrected.

### CORS Errors After Deployment

**Issue:** Frontend can't reach backend API
**Solution:**
1. Check `VITE_BACKEND_URL` in Vercel environment matches Railway URL
2. Check `FRONTEND_URL` in Railway environment matches Vercel URL
3. Verify backend CORS configuration includes your domain
4. Check backend logs for CORS errors

### OAuth Not Working

**Issue:** Can't log in with Google/GitHub
**Solution:**
1. Go to Supabase Dashboard
2. Update OAuth Redirect URLs with your Vercel domain
3. Set Site URL to `https://your-vercel-domain.vercel.app`
4. Wait 5 minutes for changes to propagate

### API Returns 502/503

**Issue:** Backend is down or not responding
**Solution:**
1. Check Railway logs: `railway logs`
2. Verify all environment variables are set
3. Check database connectivity
4. Restart the service

### WebSocket Connection Failed

**Issue:** Real-time features not working
**Solution:**
1. Update Nginx/Caddy reverse proxy to support WebSockets
2. Or use Socket.io with long-polling fallback
3. Check firewall allows WebSocket protocol

---

## 📈 Monitoring & Logs

### Railway Logs
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs

# Tail logs
railway logs -f
```

### Vercel Logs
- View in Vercel Dashboard → Deployments → Logs
- Or use Vercel CLI: `vercel logs`

### Database Logs
- Railway PostgreSQL → Logs
- Check for slow queries, errors, deadlocks

---

## 🔐 Security Checklist

- [ ] Environment variables not in git
- [ ] Database passwords secured
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] HTTPS enforced on both services
- [ ] CORS properly configured for your domains
- [ ] OAuth redirect URLs updated
- [ ] API rate limiting enabled
- [ ] Monitoring and alerting configured

---

## 📋 Deployment Checklist

### Before Deploying
- [ ] Fixed npm dependencies (removed JSR package)
- [ ] All environment variables prepared
- [ ] Database migrations tested
- [ ] Supabase OAuth configured
- [ ] API keys obtained

### During Deployment
- [ ] Push to GitHub
- [ ] Wait for Railway/Vercel builds
- [ ] Check build logs for errors
- [ ] Run database migrations (if needed)
- [ ] Test API endpoints

### After Deployment
- [ ] Frontend loads: https://yourdomain.vercel.app
- [ ] API responds: https://yourdomain.vercel.app/api/health
- [ ] OAuth works: Can log in with Google
- [ ] Database connected: Can fetch data
- [ ] Logs show no errors

---

## 🎉 Success Indicators

✅ Frontend builds successfully on Vercel
✅ Backend builds successfully on Railway
✅ Health endpoint returns 200 OK
✅ Frontend can call backend API
✅ OAuth login works
✅ Database queries succeed
✅ No CORS errors in browser console
✅ Real-time features work (if applicable)

---

## 📞 Quick Commands

```bash
# Railway
railway login                    # Login to Railway
railway link                     # Link project
railway logs                     # View logs
railway run npm run migrate     # Run migrations
railway up                      # Deploy

# Vercel
vercel deploy                   # Deploy
vercel env ls                   # List env vars
vercel logs                     # View logs
vercel env add VAR_NAME         # Add env var
```

---

## 🚀 Next Steps

1. ✅ Push fixed code to GitHub
2. ✅ Check Railway build log
3. ✅ Check Vercel build log
4. ✅ Verify health endpoints
5. ✅ Test OAuth flow
6. ✅ Set up monitoring
7. ✅ Configure custom domains
8. ✅ Enable auto-scaling (if needed)

---

**Status:** ✅ Ready for Railway + Vercel Deployment
**Last Updated:** December 2024
**Fix Applied:** JSR Package Removed, npm Dependencies Corrected
