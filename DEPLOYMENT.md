# SocialMonitor AI - Deployment Guide

## Production Deployment Status
✅ **RESOLVED: Enterprise-grade environment variable management implemented**

### Root Cause & Solution
The deployment failures were caused by missing environment variables in production. We've implemented:

1. **Centralized Configuration Management** (`server/config.ts`)
   - Enterprise-grade environment validation with descriptive error messages
   - Multiple fallback variable names (OPENAI_API_KEY, CHATGPT_API_KEY, OPENAI_TOKEN)
   - Runtime validation prevents silent failures
   - Configuration status logging for development debugging

2. **Environment Variable Templates** (`.env.example`)
   - Complete setup guide for all deployment platforms
   - Clear documentation of required vs optional variables

## Prerequisites

Before deploying, ensure you have:
- OpenAI API key from https://platform.openai.com/api-keys
- Serper API key from https://serper.dev/

## Environment Variables

### Required Variables
Set these environment variables in your deployment platform:

```bash
OPENAI_API_KEY=your_openai_api_key_here
SERPER_API_KEY=your_serper_api_key_here
```

### Optional Variables
```bash
DATABASE_URL=your_postgresql_database_url_here  # Uses in-memory storage if not provided
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
```

### Environment Variable Fallbacks
The system checks multiple names for flexibility:
- OpenAI: `OPENAI_API_KEY` → `CHATGPT_API_KEY` → `OPENAI_TOKEN`
- Serper: `SERPER_API_KEY` → `SERPER_TOKEN`

## Docker Deployment

### Option 1: Multi-stage Build (Recommended)

The included Dockerfile uses a multi-stage build that handles everything:

```bash
# Build and run locally
docker build -t socialmonitor-ai .
docker run -p 5000:5000 \
  -e OPENAI_API_KEY=your_key \
  -e SERPER_API_KEY=your_key \
  -e DATABASE_URL=your_db_url \
  socialmonitor-ai
```

### Option 2: Pre-built Assets

If you prefer to build assets locally first:

```bash
npm install
npm run build
node build.js  # Custom build script that properly handles production bundling
docker build -t socialmonitor-ai .
```

## Platform-Specific Deployments

### Railway

1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Railway will automatically detect and use the Dockerfile
4. Ensure the start command is: `node dist/index.js`

### Render

1. Create a new Web Service
2. Connect your repository
3. Set these build and start commands:
   - Build Command: `npm install && npm run build && node build.js`
   - Start Command: `npm start`
4. Add environment variables in the dashboard

### Heroku

1. Install Heroku CLI and login
2. Create a new app: `heroku create your-app-name`
3. Set environment variables:
   ```bash
   heroku config:set OPENAI_API_KEY=your_key
   heroku config:set SERPER_API_KEY=your_key
   heroku config:set DATABASE_URL=your_db_url
   ```
4. Deploy: `git push heroku main`

### Vercel/Netlify

These platforms work best with static sites. For full-stack apps like SocialMonitor AI, use Railway, Render, or Heroku instead.

## Database Setup

### PostgreSQL Database

You need a PostgreSQL database. Popular options:

1. **Neon Database** (Recommended): https://neon.tech/
2. **Railway PostgreSQL**: Available as an add-on
3. **Heroku Postgres**: Available as an add-on
4. **Supabase**: https://supabase.com/

After setting up your database:

1. Get the connection URL (starts with `postgresql://`)
2. Set it as the `DATABASE_URL` environment variable
3. The app will automatically create tables on first run

## Health Checks

The application provides health check endpoints:
- `/health` - General application health
- `/api/health` - API-specific health check

Use these for monitoring and load balancer configuration.

## Architecture Overview

SocialMonitor AI uses an **enterprise-grade dependency isolation architecture** that ensures development tools never leak into production builds. See `ARCHITECTURE.md` for detailed technical specifications.

## Configuration Features

### Development Status Logging
In development mode, the system logs configuration status:
```
🚀 SocialMonitor AI serving on 0.0.0.0:5000
Environment: development
Port: 5000
Host: 0.0.0.0
OpenAI API: ✓ Configured
Serper API: ✓ Configured
Database: ✗ Not set
```

### Helpful Error Messages
Instead of generic "Missing API key" errors, the system provides:
- Exact environment variable names to set
- Links to get API keys
- Platform-specific setup instructions

## Troubleshooting

### Common Issues

1. **"Missing OpenAI API key"** → Set `OPENAI_API_KEY` in your deployment platform
2. **"Missing Serper API key"** → Set `SERPER_API_KEY` in your deployment platform
3. **502 Bad Gateway**: Usually means the app isn't starting or binding to the correct port
   - Ensure `PORT` environment variable is set correctly
   - Check logs for startup errors
4. **Build Failures**:
   - Make sure all dependencies are in `package.json`
   - Run `npm run build && node build.js` locally to test
   - Ensure the `dist/` directory contains both `public/` (client) and `index.js` (server)

### Logs and Monitoring

- Check application logs in your platform's dashboard
- Monitor the `/health` endpoint for uptime
- Set up alerts for 5xx errors

## Performance Optimization

### Production Recommendations

1. Set up a CDN for static assets
2. Enable gzip compression (usually automatic on platforms)
3. Monitor memory usage and scale as needed
4. Set up database connection pooling for high traffic

### Scaling

- Most platforms offer automatic scaling
- Monitor API usage to stay within rate limits
- Consider implementing request queuing for high loads

## Security Notes

1. Never commit API keys to version control
2. Use environment variables for all secrets
3. The Docker image runs as non-root user for security
4. HTTPS is enforced by most platforms automatically

## Support

For deployment issues:
1. Check the platform-specific documentation
2. Review application logs for errors
3. Verify all environment variables are set correctly
4. Test health endpoints to ensure the app is running