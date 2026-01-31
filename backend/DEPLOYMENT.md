# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration ✓
- [ ] Copy `.env.example` to `.env` in production server
- [ ] Set `NODE_ENV=production`
- [ ] Generate strong random strings for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Configure production database URL with connection pooling
- [ ] Set appropriate `ALLOWED_ORIGINS` for CORS

### 2. Database Setup ✓
- [ ] Ensure PostgreSQL is installed and running
- [ ] Create production database
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Verify migrations: `npx prisma migrate status`
- [ ] Generate Prisma Client: `npx prisma generate`

### 3. Security Hardening ✓
- [ ] Review all environment variables
- [ ] Ensure no sensitive data in code
- [ ] Configure Helmet.js headers
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure rate limiting (recommended)
- [ ] Review CORS settings

### 4. Dependencies ✓
- [ ] Run `npm ci --only=production` (clean install)
- [ ] Remove dev dependencies in production
- [ ] Verify no vulnerabilities: `npm audit`

### 5. Testing ✓
- [ ] Run all unit tests: `npm test`
- [ ] Perform manual API testing
- [ ] Test authentication flow
- [ ] Test booking flow end-to-end
- [ ] Verify provider dashboard features

### 6. Performance ✓
- [ ] Enable database connection pooling
- [ ] Configure appropriate pool size
- [ ] Set up caching (Redis recommended)
- [ ] Optimize Prisma queries

### 7. Monitoring & Logging ✓
- [ ] Configure Winston for production logs
- [ ] Set up log rotation
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure performance monitoring (New Relic, DataDog, etc.)

## Deployment Options

### Option 1: PM2 (Recommended for VPS)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start index.js --name parking-api -i max

# Configure auto-restart on server reboot
pm2 startup
pm2 save

# Monitor
pm2 monit

# View logs
pm2 logs parking-api
```

### Option 2: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY . .

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

```bash
# Build
docker build -t parking-api:latest .

# Run
docker run -d \
  --name parking-api \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  parking-api:latest
```

### Option 3: Cloud Platforms

#### Heroku
```bash
# Login
heroku login

# Create app
heroku create parking-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy
```

#### Railway/Render
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Configure build command: `npm install && npx prisma generate`
4. Configure start command: `npm start`
5. Add PostgreSQL addon
6. Deploy

## Post-Deployment

### 1. Verify Deployment ✓
```bash
# Health check
curl https://your-domain.com/health

# API docs
curl https://your-domain.com/api-docs
```

### 2. Database Verification ✓
```bash
# Check Prisma connection
npx prisma db pull

# Verify tables
npx prisma studio
```

### 3. Monitor Logs ✓
```bash
# PM2
pm2 logs parking-api --lines 100

# Docker
docker logs parking-api -f

# Heroku
heroku logs --tail
```

## Rollback Plan

### PM2
```bash
pm2 stop parking-api
pm2 delete parking-api
# Deploy previous version
pm2 start index.js --name parking-api
```

### Docker
```bash
docker stop parking-api
docker rm parking-api
docker run -d --name parking-api parking-api:previous-tag
```

### Database Rollback
```bash
# Prisma Migration Rollback (use with caution)
npx prisma migrate resolve --rolled-back <migration_name>
```

## Maintenance

### Backup Strategy
- Daily automated database backups
- Store backups in separate location
- Test restoration process monthly

### Update Process
1. Test updates in staging environment
2. Run database migrations
3. Deploy with zero-downtime strategy
4. Monitor logs and metrics
5. Keep rollback plan ready

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify DATABASE_URL format
- Check firewall rules
- Verify database is running
- Check connection pool settings

**JWT Errors**
- Verify JWT_SECRET is set
- Check token expiration settings
- Ensure consistent secret across instances

**Performance Issues**
- Enable database query logging
- Check connection pool size
- Review slow queries in Prisma
- Consider adding Redis cache

## Security Best Practices

1. **Never commit `.env` files**
2. **Use environment-specific secrets**
3. **Enable HTTPS only in production**
4. **Implement rate limiting**
5. **Regular security audits**
6. **Keep dependencies updated**
7. **Use database connection pooling**
8. **Implement request logging**

## Production Environment Variables

```env
# Mandatory
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10"
JWT_SECRET="production-secret-min-32-chars"
JWT_REFRESH_SECRET="production-refresh-secret"
NODE_ENV="production"

# Optional but Recommended
PORT=5000
ALLOWED_ORIGINS="https://www.yourapp.com,https://app.yourapp.com"
LOG_LEVEL="info"
```

## Final Checklist Before Going Live

- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] SSL/HTTPS configured
- [ ] Monitoring and logging active
- [ ] Backups configured
- [ ] Load testing completed
- [ ] Security review passed
- [ ] API documentation accessible
- [ ] Error tracking configured
- [ ] Team trained on deployment process

---

**Need Help?** Refer to README.md for detailed setup instructions or contact the development team.
