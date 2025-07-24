# Replit Production Deployment Fix

## Problem
Your API keys are stored in Replit App Secrets but the production deployment can't access them, causing this error:
```
Error: Missing OpenAI API key. Please set one of these environment variables:
- OPENAI_API_KEY (preferred)
- CHATGPT_API_KEY (fallback)  
- OPENAI_TOKEN (fallback)
```

## Root Cause
Replit App Secrets are available in development environment but not automatically passed to production deployments.

## Solution

### Option 1: Manual Environment Variables (Recommended)
1. **Click the "Deploy" button** in Replit
2. **Go to your deployment settings**
3. **Add environment variables manually:**
   - `OPENAI_API_KEY`: Your OpenAI API key (starts with sk-)
   - `SERPER_API_KEY`: Your Serper API key

### Option 2: Use Environment Export
Before deploying, run these commands in the Replit console:
```bash
export OPENAI_API_KEY="${OPENAI_API_KEY}"
export SERPER_API_KEY="${SERPER_API_KEY}"
npm run build
```

### Option 3: Use Deployment Script
Run the deployment script I created:
```bash
./deploy.sh
```

## Verification
The working deployment should show:
```
🚀 SocialMonitor AI serving on 0.0.0.0:5000
Environment: production
OpenAI API: ✓ Configured
Serper API: ✓ Configured
```

## For Other Platforms
If deploying to Railway, Render, Heroku:
1. **Railway**: Dashboard > Variables > Add OPENAI_API_KEY and SERPER_API_KEY
2. **Render**: Dashboard > Environment > Add variables
3. **Heroku**: `heroku config:set OPENAI_API_KEY=your-key SERPER_API_KEY=your-key`

The application will automatically validate and provide helpful error messages if any keys are missing.