/**
 * Runtime Environment Configuration
 * Basic server configuration without API key validation
 */

interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  host: string;
  database: {
    url?: string;
  };
  reddit: {
    enabled: boolean; // Reddit credentials are provided via UI, not environment variables
  };
}

/**
 * Creates basic application configuration without API key validation
 * API keys are now managed dynamically at runtime
 */
function createConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as AppConfig['nodeEnv'];

  // Reddit OAuth configuration (handled via runtime authentication only)
  const redditConfig = {
    enabled: false // Reddit credentials are provided via UI, not environment variables
  };

  // Auto-detect Replit domain for OAuth if not explicitly set
  if (!process.env.REDDIT_REDIRECT_URI && process.env.REPLIT_DOMAINS) {
    const replitDomain = process.env.REPLIT_DOMAINS.split(',')[0];
    process.env.REDDIT_REDIRECT_URI = `https://${replitDomain}/auth/reddit/callback`;
  }

  // Database configuration with deployment fallbacks
  if (process.env.DATABASE_URL) {
    console.log('✅ PostgreSQL database configured');
    console.log('📊 DATABASE_URL available:', process.env.DATABASE_URL ? 'Yes' : 'No');
  } else if (process.env.REPLIT_DB_URL) {
    console.log('✅ Replit Database available for development');
  } else {
    console.log('⚠️ No database configured, using in-memory storage for deployment');
    console.log('💡 For production, enable PostgreSQL in your Repl settings');
  }

  return {
    nodeEnv,
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
    database: {
      url: process.env.DATABASE_URL
    },
    reddit: redditConfig
  };
}

/**
 * Application configuration singleton
 * Validates environment on first access
 */
export const config = createConfig();

/**
 * Development helper - logs configuration status without exposing secrets
 */
export async function logConfigStatus() {
  const { log } = process.env.NODE_ENV === "development"
    ? await import("./vite")
    : await import("./production");

  const { runtimeConfig } = await import("./runtime-config");
  const keyStatus = runtimeConfig.getAPIKeyStatus();

  log(`Environment: ${config.nodeEnv}`);
  log(`Port: ${config.port}`);
  log(`Host: ${config.host}`);
  log(`OpenAI API: ${keyStatus.openai ? '✓ Configured' : '✗ Missing'}`);
  log(`Gemini API: ${keyStatus.gemini ? '✓ Configured' : '✗ Missing'}`);
  log(`Serper API: ${keyStatus.serper ? '✓ Configured' : '✗ Missing'}`);
  // Check if we're using Replit Database or PostgreSQL
  const usingReplitDB = process.env.REPLIT_DB_URL || process.env.REPL_ID;
  const databaseStatus = config.database.url ? '✓ PostgreSQL' :
                        usingReplitDB ? '✓ Replit Database' : '✗ Not set';
  log(`Database: ${databaseStatus}`);
  log(`Reddit OAuth: ${config.reddit.enabled ? '✓ Configured' : '✗ Not configured (UI required)'}`);
}