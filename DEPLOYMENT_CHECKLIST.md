# Mapify Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Quality
- [x] All unit tests passing (73/73)
- [x] ESLint validation (0 errors, 0 warnings)
- [x] TypeScript compilation (0 errors)
- [x] Production build successful (39 routes)
- [x] No console.log statements in components
- [x] All critical bugs fixed

### ✅ Environment Variables
**Required variables:**
```bash
DATABASE_URL="postgresql://..."          # PostgreSQL connection string
NEXTAUTH_URL="https://yourdomain.com"    # Your production URL
NEXTAUTH_SECRET="..."                    # 32+ character random string
ENCRYPTION_KEY="..."                     # 32+ character random string
NEXT_PUBLIC_APP_NAME="Mapify"            # App name
```

**Optional variables:**
```bash
REDIS_URL="redis://..."                  # For distributed rate limiting
TAVILY_API_KEY="..."                     # For web search
SERPAPI_API_KEY="..."                    # For web search
BING_SEARCH_API_KEY="..."                # For web search
```

**Generate secrets:**
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -base64 32
```

### ✅ Database Setup
- [x] PostgreSQL database created
- [x] DATABASE_URL configured
- [x] Run migrations:
  ```bash
  npx prisma migrate deploy
  ```
- [x] Verify connection:
  ```bash
  npx prisma db pull
  ```
- [x] (Optional) Seed initial data:
  ```bash
  npm run db:seed
  ```

### ✅ Security Review
- [x] All secrets in environment variables (not hardcoded)
- [x] API keys encrypted at rest
- [x] Rate limiting enabled
- [x] CSRF protection (SameSite cookies)
- [x] XSS prevention (React sanitization)
- [x] SQL injection prevention (Prisma ORM)
- [x] No sensitive data in logs
- [x] HTTPS enforced in production

---

## Deployment Options

### Option 1: Vercel (Recommended)

**Setup:**
1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

**Environment Variables in Vercel:**
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-here
ENCRYPTION_KEY=your-encryption-key-here
NEXT_PUBLIC_APP_NAME=Mapify
```

**Advantages:**
- Zero-config Next.js deployment
- Automatic HTTPS
- Edge caching
- GitHub integration
- Free tier available

### Option 2: Railway

**Setup:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create new project
railway init

# Add PostgreSQL
railway add --service postgresql

# Deploy
railway up
```

**Advantages:**
- Integrated PostgreSQL
- Easy Redis addon
- Simple CLI
- Good free tier

### Option 3: Docker + DigitalOcean

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
    depends_on:
      - postgres
  
  postgres:
    image: postgres:14
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Deploy to DigitalOcean:**
```bash
# Build and push image
docker build -t mapify .
docker tag mapify registry.digitalocean.com/your-registry/mapify
docker push registry.digitalocean.com/your-registry/mapify

# Deploy via DigitalOcean App Platform or Droplet
```

### Option 4: AWS (Amplify/ECS)

**AWS Amplify:**
1. Connect GitHub repository
2. Configure build settings
3. Add environment variables
4. Deploy

**Build settings (amplify.yml):**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npx prisma generate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

---

## Post-Deployment

### 1. Verify Production Build
```bash
# Test production build locally first
npm run build
npm start

# Visit http://localhost:3000
```

### 2. Database Migration
```bash
# Run migrations in production
DATABASE_URL=your-prod-url npx prisma migrate deploy
```

### 3. Smoke Tests
- [ ] Home page loads
- [ ] Signup/login works
- [ ] Dashboard loads after login
- [ ] Settings page accessible
- [ ] API key can be added
- [ ] Mind map generation works
- [ ] Theme toggle works and persists
- [ ] Logout clears session

### 4. Monitor & Logging

**Set up monitoring:**
- Application logs (stdout/stderr)
- Error tracking (Sentry recommended)
- Performance monitoring
- Database connection pool

**Recommended: Sentry Integration**
```bash
npm install @sentry/nextjs

# Follow Sentry Next.js setup guide
npx @sentry/wizard@latest -i nextjs
```

### 5. Performance Optimization

**Enable caching:**
- Static assets: CDN (Cloudflare/Vercel Edge)
- API responses: Redis caching
- Database queries: Connection pooling

**Monitor metrics:**
- Page load times (<3s target)
- API response times (<500ms for DB queries)
- LLM generation times (5-30s acceptable)
- Error rates (<1%)

### 6. Backup Strategy

**Database backups:**
```bash
# Automated daily backups (configure with your provider)
# Supabase: Built-in daily backups
# Railway: Enable automatic backups
# Self-hosted: Set up pg_dump cron job
```

**Example backup script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "backup_$DATE.sql"
# Upload to S3 or backup storage
```

---

## Environment-Specific Configuration

### Development
```bash
DATABASE_URL="postgresql://localhost:5432/mindmap_dev"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-32-chars-min"
ENCRYPTION_KEY="dev-encryption-32-chars-min"
```

### Staging
```bash
DATABASE_URL="postgresql://staging-db"
NEXTAUTH_URL="https://staging.yourdomain.com"
NEXTAUTH_SECRET="staging-secret-different-from-prod"
ENCRYPTION_KEY="staging-encryption-different-from-prod"
```

### Production
```bash
DATABASE_URL="postgresql://production-db"
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production-secret-strong-random"
ENCRYPTION_KEY="production-encryption-strong-random"
REDIS_URL="redis://production-redis"  # Optional but recommended
```

---

## Troubleshooting

### Build Failures

**Issue: "Cannot find module '@prisma/client'"**
```bash
npx prisma generate
npm run build
```

**Issue: "Environment variable not found"**
- Verify all required env vars are set
- Check for typos in variable names
- Ensure .env files are not in .gitignore for deployment

### Runtime Errors

**Issue: "Database connection failed"**
- Verify DATABASE_URL is correct
- Check database accepts connections from deployment IP
- For Supabase: Ensure connection pooling is enabled

**Issue: "Decryption failed for API key"**
- ENCRYPTION_KEY must be the same as when keys were encrypted
- If changed, users must re-enter their API keys

**Issue: "Session expired immediately"**
- Check NEXTAUTH_SECRET is set and 32+ characters
- Verify NEXTAUTH_URL matches your domain exactly
- Check cookies are allowed (SameSite settings)

### Performance Issues

**Issue: Slow page loads**
- Enable Redis for caching
- Use CDN for static assets
- Optimize database queries with indexes
- Enable Next.js ISR where appropriate

**Issue: Database connection pool exhausted**
```typescript
// Increase pool size in DATABASE_URL
postgresql://user:pass@host:5432/db?connection_limit=20
```

---

## Health Checks

### Automated Health Check Endpoint
```bash
# Test health endpoint
curl https://yourdomain.com/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-12-...",
  "services": {
    "database": "connected",
    "redis": "connected"  // if configured
  }
}
```

### Monitoring Checklist
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure error alerts (email/Slack)
- [ ] Monitor database performance
- [ ] Track API response times
- [ ] Monitor LLM API usage/costs

---

## Security Hardening

### Production Security Checklist
- [ ] HTTPS enforced (automatic with Vercel/Railway)
- [ ] Security headers configured (in next.config.ts)
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] No sensitive data in client-side code
- [ ] API keys encrypted in database
- [ ] Session tokens secure and httpOnly
- [ ] SQL injection prevented (Prisma ORM)
- [ ] XSS prevented (React escaping)
- [ ] CSRF tokens (SameSite cookies)

### Security Headers (already configured in next.config.ts)
```typescript
{
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=31536000",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "origin-when-cross-origin"
}
```

---

## Rollback Plan

### If deployment fails:
1. **Immediate:** Revert to previous version
   ```bash
   # Vercel
   vercel rollback
   
   # Railway
   railway rollback
   
   # Docker
   docker pull your-image:previous-tag
   docker restart container
   ```

2. **Database:** Restore from backup if migrations fail
   ```bash
   psql $DATABASE_URL < backup_latest.sql
   ```

3. **Notify users:** If downtime > 5 minutes

---

## Success Criteria

### Deployment is successful when:
- [ ] All 39 routes accessible
- [ ] Users can sign up and log in
- [ ] API keys can be saved (encrypted)
- [ ] Mind maps can be generated
- [ ] Theme persists across sessions
- [ ] No console errors in browser
- [ ] All API endpoints return 200/201 for valid requests
- [ ] Error pages display correctly (404, 500)
- [ ] Mobile responsive layout works
- [ ] Performance metrics acceptable (<3s page load)

---

## Next Steps After Deployment

1. **Monitor for 24 hours:**
   - Watch error logs
   - Check user signups
   - Monitor API usage
   - Track performance metrics

2. **User feedback:**
   - Set up feedback mechanism
   - Monitor user issues
   - Track feature usage

3. **Optimization:**
   - Enable caching where beneficial
   - Optimize slow queries
   - Add indexes to database

4. **Features:**
   - Deploy WebSocket server for collaboration
   - Add Redis for distributed rate limiting
   - Implement full-text search
   - Add more export formats

---

## Contact & Support

**Technical Issues:**
- Check logs in deployment dashboard
- Review error tracking (Sentry)
- Database logs in provider dashboard

**Documentation:**
- README.md - Project overview
- SETUP.md - Development setup
- QA_FINAL_REPORT.md - Testing results
- API documentation in code comments

---

**Deployment Status:**
- [ ] Pre-deployment checks complete
- [ ] Environment configured
- [ ] Database migrated
- [ ] Application deployed
- [ ] Post-deployment verification done
- [ ] Monitoring enabled
- [ ] Ready for users ✅
