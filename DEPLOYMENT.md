# SocialMonitor AI - Deployment Guide

## Quick Fix for Current Deployment Issue

Based on the logs you shared, your deployment is only running Caddy (reverse proxy) but not the Node.js server. Here's how to fix it:

### Option 1: Simple Node.js Only Deployment
Remove Caddy entirely and run just Node.js:

```bash
# Build the application
npm run build

# Start the server (listens on process.env.PORT)
npm run start
```

The Express server is already configured to:
- Listen on `process.env.PORT` or 5000
- Serve static files in production mode
- Handle all routes including API and frontend

### Option 2: If You Must Use Caddy
Create a start script that runs both:

```bash
#!/bin/bash
# Start Node.js server in background
npm run start &

# Start Caddy
caddy run --config /assets/Caddyfile --adapter caddyfile
```

Your Caddyfile should proxy to the Node.js server:
```
:80 {
    reverse_proxy localhost:5000
}
```

## Environment Variables Required

- `OPENAI_API_KEY` - For AI reply generation
- `SERPER_API_KEY` - For search functionality  
- `PORT` - Server port (automatically set by most platforms)
- `NODE_ENV` - Set to "production" for deployment

## Health Check Endpoints

The application now includes health check endpoints:
- `GET /health` - Basic health check
- `GET /api/health` - API health check

## Build Process

1. Frontend: `vite build` → outputs to `dist/public`
2. Backend: `esbuild` → bundles server to `dist/index.js`

## Port Configuration

The server is configured to:
- Bind to `0.0.0.0` (accepts external connections)
- Use `process.env.PORT` or default to 5000
- Serve both API routes and static frontend files

## Common Deployment Issues

1. **502 Bad Gateway**: Node.js server not running
2. **404 on /**: Missing static file serving (fixed in this setup)
3. **API not working**: Check environment variables are set

## Platform-Specific Notes

### Railway/Render/Heroku
Use the existing `npm run start` command.

### Docker
A Dockerfile is provided. Build with:
```bash
docker build -t socialmonitor-ai .
docker run -p 5000:5000 -e OPENAI_API_KEY=xxx -e SERPER_API_KEY=xxx socialmonitor-ai
```

### Replit (Current Environment)
Already configured and working with the "Start application" workflow.