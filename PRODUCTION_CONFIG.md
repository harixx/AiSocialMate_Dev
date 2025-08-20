
# Production Configuration Guide

## Required Environment Variables

### Core Services
```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Serper API Configuration (for search functionality)
SERPER_API_KEY=your_serper_api_key_here

# Gemini API Configuration (optional)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Database Configuration (Production)
```bash
# PostgreSQL Database URL
DATABASE_URL=postgresql://username:password@host:port/database_name

# Database connection pool settings
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Alert System Configuration
```bash
# Monthly API quota limit
MONTHLY_API_QUOTA=10000

# Email configuration for notifications
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_email@company.com
SMTP_PASS=your_email_password
SMTP_FROM=alerts@yourcompany.com

# Webhook security
WEBHOOK_SECRET_KEY=your_webhook_secret_for_hmac_signing
```

### Security Configuration
```bash
# JWT secret for authentication
JWT_SECRET=your_very_secure_jwt_secret_here

# API rate limiting
RATE_LIMIT_WINDOW=15  # minutes
RATE_LIMIT_MAX=100    # requests per window

# CORS origins (comma-separated)
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

## Production Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured in Replit Secrets
- [ ] Database schema migrated and up-to-date
- [ ] API keys validated and have sufficient quotas
- [ ] SMTP email configuration tested
- [ ] Webhook endpoints tested and secured

### Monitoring Setup
- [ ] Health check endpoints configured (`/health`, `/health/detailed`)
- [ ] Error logging and alerting configured
- [ ] Quota monitoring dashboard accessible
- [ ] Performance monitoring enabled
- [ ] Backup and recovery procedures documented

### Security Checklist
- [ ] All sensitive data moved to environment variables
- [ ] CORS properly configured for production domains
- [ ] Rate limiting enabled
- [ ] Webhook signatures verified
- [ ] SQL injection protection enabled
- [ ] Input validation on all endpoints

### Performance Optimization
- [ ] Database connection pooling configured
- [ ] API response caching implemented where appropriate
- [ ] Large result sets paginated
- [ ] Background job processing optimized
- [ ] Memory usage monitored

## Monitoring and Alerts

### Key Metrics to Monitor
1. **Alert Processing Performance**
   - Average processing time per alert
   - API call success rate
   - Number of new presences detected

2. **System Health**
   - Database connection status
   - API service availability
   - Memory and CPU usage

3. **Business Metrics**
   - Active alerts count
   - Monthly quota utilization
   - User engagement metrics

### Recommended Alert Thresholds
- API quota usage > 90%
- Alert processing time > 2 minutes
- Failed alert runs > 10% in 24h period
- Database connection failures
- External API service downtime

## Scaling Considerations

### Horizontal Scaling
- Alert processing can be distributed across multiple workers
- Database read replicas for analytics queries
- CDN for static assets

### Vertical Scaling
- Increase memory allocation for large competitor lists
- CPU optimization for fuzzy matching algorithms
- SSD storage for faster database operations

## Backup and Recovery

### Data Backup Strategy
1. **Database Backups**
   - Daily automated backups
   - Point-in-time recovery capability
   - Cross-region backup storage

2. **Configuration Backups**
   - Environment variables documentation
   - Alert configurations export
   - User preferences backup

### Disaster Recovery
1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Failover procedures documented**
4. **Regular disaster recovery testing**
