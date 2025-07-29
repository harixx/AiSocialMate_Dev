# Reddit OAuth Integration Setup Guide

## Overview

SocialMonitor AI now supports proper Reddit OAuth authentication to access the full Reddit API, enabling real-time comment fetching with complete threading, scores, and metadata. This guide walks you through setting up Reddit OAuth authentication for production-ready Reddit integration.

## Prerequisites

- Reddit account for API registration
- Application deployed and accessible via a public URL
- Environment variables configured for Reddit OAuth

## Step 1: Create a Reddit Application

### 1. Go to Reddit App Preferences
Visit: https://www.reddit.com/prefs/apps

### 2. Click "Create App" or "Create Another App"

### 3. Fill out the application form:

**Name:** `SocialMonitor AI`
- Choose a unique, descriptive name

**App Type:** `web app`
- Select "web app" for server-based applications

**Description:** `AI-powered social media monitoring and comment analysis tool`
- Brief description of your application's purpose

**About URL:** `https://your-domain.com` 
- Your application's homepage URL (optional but recommended)

**Redirect URI:** `https://your-domain.com/auth/reddit/callback`
- **CRITICAL:** This must exactly match your callback URL
- For local development: `http://localhost:5000/auth/reddit/callback`
- For production: Your actual domain callback URL

### 4. Click "Create app"

## Step 2: Retrieve Your OAuth Credentials

After creating the app, you'll see:

1. **Client ID:** Located under the app name (14-character string)
2. **Client Secret:** The "secret" field (longer string)

## Step 3: Configure Environment Variables

Add these environment variables to your application:

```bash
# Reddit OAuth Configuration
REDDIT_CLIENT_ID=your_14_char_client_id
REDDIT_CLIENT_SECRET=your_secret_key_here
REDDIT_REDIRECT_URI=https://your-domain.com/auth/reddit/callback

# For local development
# REDDIT_REDIRECT_URI=http://localhost:5000/auth/reddit/callback
```

## Step 4: Update Your Application Domain

### For Replit Deployment:
1. Deploy your application to get your `.replit.app` domain
2. Update the Reddit app's "Redirect URI" to: `https://your-app-name.your-username.replit.app/auth/reddit/callback`

### For Custom Domain:
Use your custom domain: `https://yourdomain.com/auth/reddit/callback`

## Step 5: Test the Integration

1. Restart your application after adding environment variables
2. Navigate to the Thread Discovery section
3. Look for the "Reddit API Authentication" card
4. Click "Authenticate Reddit" button
5. Complete the OAuth flow on Reddit
6. You should see "Authenticated" status

## Step 6: Verify Full API Access

Once authenticated:
1. Search for Reddit threads in Thread Discovery
2. Click "Show Comments" on a Reddit post
3. You should see:
   - "OAuth API" badge indicating authenticated access
   - Full comment threads with nested replies
   - Real-time comment scores and metadata
   - Complete post information

## Troubleshooting

### Common Issues:

**"Invalid redirect URI" error:**
- Ensure the redirect URI in your Reddit app exactly matches your callback URL
- Check for trailing slashes, http vs https, and exact domain spelling

**"Missing client credentials" error:**
- Verify REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are set
- Check environment variable names match exactly

**"Authentication failed" error:**
- Confirm your Reddit app is active and not suspended
- Verify the client secret is correct and hasn't been regenerated

**"Rate limiting" messages:**
- Reddit allows 100 requests per minute per authenticated user
- Implement caching and respect rate limits

### Environment Variable Validation:

The application will show configuration status on startup:
```
Reddit OAuth: ✓ Configured
```

If you see an error, check your environment variables.

## Production Considerations

### Security:
- Never expose client secrets in frontend code
- Use HTTPS for all OAuth redirects
- Implement proper session management
- Store tokens securely (Redis/database)

### Rate Limiting:
- Reddit API: 100 requests/minute per authenticated user
- Implement request caching where appropriate
- Consider implementing request queuing for high-volume usage

### User Experience:
- Handle token expiration gracefully
- Provide clear authentication status indicators
- Allow users to re-authenticate when needed

## API Capabilities with OAuth

With proper authentication, you gain access to:

- **Full Comment Threads:** Complete nested comment structures
- **Real-time Data:** Live scores, timestamps, and user information  
- **Rich Metadata:** Post statistics, subreddit information, user profiles
- **Advanced Filtering:** Sort by top, new, controversial, etc.
- **Higher Rate Limits:** 100 requests/minute vs public API restrictions

## Alternative Access Methods

Without OAuth authentication, the system falls back to:
- RSS feeds for basic post information
- Limited metadata and no comment threading
- Educational content about OAuth benefits
- Direct links to view content on Reddit

## Support

For additional help:
- Reddit API Documentation: https://www.reddit.com/dev/api/
- OAuth 2.0 Specification: https://oauth.net/2/
- Reddit API Terms: https://www.redditinc.com/policies/data-api-terms

The authentication system is designed to gracefully handle both authenticated and non-authenticated states, providing value in both scenarios while encouraging users to complete the OAuth flow for the best experience.