# SocialMonitor AI - Deployment Guide

## Overview

This guide covers deploying SocialMonitor AI to various platforms including Railway, Render, Heroku, and other container-based platforms.

## Prerequisites

Before deploying, ensure you have:
- OpenAI API key from https://platform.openai.com/api-keys
- Serper API key from https://serper.dev/

## Environment Variables

Set these environment variables in your deployment platform:

```bash
OPENAI_API_KEY=your_openai_api_key_here
SERPER_API_KEY=your_serper_api_key_here
DATABASE_URL=your_postgresql_database_url_here
NODE_ENV=production
PORT=5000
```

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

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**: Usually means the app isn't starting or binding to the correct port
   - Ensure `PORT` environment variable is set correctly
   - Check logs for startup errors

2. **API Key Errors**: 
   - Verify `OPENAI_API_KEY` and `SERPER_API_KEY` are set
   - Check that keys are valid and have sufficient credits

3. **Database Connection Issues**:
   - Verify `DATABASE_URL` is correct
   - Ensure database allows connections from your deployment platform

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