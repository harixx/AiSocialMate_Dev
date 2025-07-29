import { Request, Response } from 'express';
import { config } from './config';

interface RedditTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

interface RedditOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  userAgent: string;
}

class RedditOAuthClient {
  private config: RedditOAuthConfig;
  private tokens: Map<string, { token: string; expires: number }> = new Map();

  constructor(config: RedditOAuthConfig) {
    this.config = config;
  }

  /**
   * Generate Reddit OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: 'code',
      state: state,
      redirect_uri: this.config.redirectUri,
      duration: 'temporary', // or 'permanent' for refresh tokens
      scope: 'read' // Basic read permissions for comments
    });

    return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<RedditTokenResponse> {
    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': this.config.userAgent,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.config.redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Reddit OAuth token exchange failed: ${response.status} - ${errorText}`);
    }

    const tokenData: RedditTokenResponse = await response.json();
    
    // Store token with expiration
    const expiresAt = Date.now() + (tokenData.expires_in * 1000);
    this.tokens.set('current', { token: tokenData.access_token, expires: expiresAt });
    
    return tokenData;
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidToken(): Promise<string | null> {
    const stored = this.tokens.get('current');
    
    if (!stored) {
      return null;
    }

    // Check if token is still valid (with 5 minute buffer)
    if (stored.expires > Date.now() + 300000) {
      return stored.token;
    }

    // Token expired, remove it
    this.tokens.delete('current');
    return null;
  }

  /**
   * Fetch Reddit comments using authenticated API
   */
  async fetchComments(subreddit: string, articleId: string): Promise<any> {
    const token = await this.getValidToken();
    
    if (!token) {
      throw new Error('No valid Reddit OAuth token available. User needs to re-authenticate.');
    }

    const url = `https://oauth.reddit.com/r/${subreddit}/comments/${articleId}?limit=100&depth=10&sort=top&raw_json=1`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': this.config.userAgent,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token invalid, remove it
        this.tokens.delete('current');
        throw new Error('Reddit OAuth token expired. User needs to re-authenticate.');
      }
      throw new Error(`Reddit API request failed: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Check if user has valid authentication
   */
  isAuthenticated(): boolean {
    const stored = this.tokens.get('current');
    return stored ? stored.expires > Date.now() + 300000 : false;
  }
}

// Dynamic Reddit OAuth credentials storage
let dynamicCredentials: RedditOAuthConfig | null = null;

// Initialize Reddit OAuth client with environment variables
const getRedirectUri = () => {
  if (process.env.REDDIT_REDIRECT_URI) {
    return process.env.REDDIT_REDIRECT_URI;
  }
  
  // Auto-detect Replit domain or use localhost for development
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS}/auth/reddit/callback`;
  }
  
  return 'http://localhost:5000/auth/reddit/callback';
};

// Create Reddit OAuth client with current credentials
const createRedditOAuthClient = (): RedditOAuthClient => {
  const config = dynamicCredentials || {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
    redirectUri: getRedirectUri(),
    userAgent: 'SocialMonitor:v1.0.0 (by /u/socialmonitor)'
  };
  
  return new RedditOAuthClient(config);
};

// Set dynamic Reddit OAuth credentials
const setRedditCredentials = (credentials: { clientId: string; clientSecret: string; redirectUri: string }) => {
  dynamicCredentials = {
    ...credentials,
    userAgent: 'SocialMonitor:v1.0.0 (by /u/socialmonitor)'
  };
};

// Check if credentials are configured
const hasRedditCredentials = (): boolean => {
  if (dynamicCredentials) {
    return !!(dynamicCredentials.clientId && dynamicCredentials.clientSecret && dynamicCredentials.redirectUri);
  }
  return !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET);
};

const redditOAuth = createRedditOAuthClient();

export { redditOAuth, RedditOAuthClient, setRedditCredentials, hasRedditCredentials, createRedditOAuthClient };
export type { RedditTokenResponse, RedditOAuthConfig };