/**
 * Enterprise Environment Configuration
 * Centralized configuration management with validation and fallbacks
 */

interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  host: string;
  openai: {
    apiKey: string;
  };
  gemini: {
    apiKey: string;
  };
  serper: {
    apiKey: string;
  };
  database: {
    url?: string;
  };
  reddit: {
    enabled: boolean; // Reddit credentials are provided via UI, not environment variables
  };
}

/**
 * Validates and returns application configuration
 * Throws descriptive errors for missing required environment variables
 */
function createConfig(): AppConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as AppConfig['nodeEnv'];

  // OpenAI API Key with multiple fallback names
  const openaiApiKey = process.env.OPENAI_API_KEY ||
                      process.env.CHATGPT_API_KEY ||
                      process.env.OPENAI_TOKEN;

  // Gemini API Key with fallback names
  const geminiApiKey = process.env.GEMINI_API_KEY ||
                      process.env.GOOGLE_AI_API_KEY;

  // Serper API Key with fallback names
  const serperApiKey = process.env.SERPER_API_KEY ||
                      process.env.SERPER_TOKEN;

  // Validation with helpful error messages
  if (!openaiApiKey) {
    throw new Error(
      `Missing OpenAI API key. Please set one of these environment variables:
      - OPENAI_API_KEY (preferred)
      - CHATGPT_API_KEY (fallback)
      - OPENAI_TOKEN (fallback)

      Get your API key from: https://platform.openai.com/api-keys`
    );
  }

  if (!geminiApiKey) {
    throw new Error(
      `Missing Gemini API key. Please set one of these environment variables:
      - GEMINI_API_KEY (preferred)
      - GOOGLE_AI_API_KEY (fallback)

      Get your API key from: https://makersuite.google.com/app/apikey`
    );
  }

  if (!serperApiKey) {
    throw new Error(
      `Missing Serper API key. Please set one of these environment variables:
      - SERPER_API_KEY (preferred)
      - SERPER_TOKEN (fallback)

      Get your API key from: https://serper.dev/`
    );
  }

  // Reddit OAuth configuration (handled via runtime authentication only)
  const redditConfig = {
    enabled: false // Reddit credentials are provided via UI, not environment variables
  };

  // Auto-detect Replit domain for OAuth if not explicitly set
  if (!process.env.REDDIT_REDIRECT_URI && process.env.REPLIT_DOMAINS) {
    const replitDomain = process.env.REPLIT_DOMAINS.split(',')[0];
    process.env.REDDIT_REDIRECT_URI = `https://${replitDomain}/auth/reddit/callback`;
  }

  return {
    nodeEnv,
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
    openai: {
      apiKey: openaiApiKey
    },
    gemini: {
      apiKey: geminiApiKey
    },
    serper: {
      apiKey: serperApiKey
    },
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

  log(`Environment: ${config.nodeEnv}`);
  log(`Port: ${config.port}`);
  log(`Host: ${config.host}`);
  log(`OpenAI API: ${config.openai.apiKey ? '✓ Configured' : '✗ Missing'}`);
  log(`Gemini API: ${config.gemini.apiKey ? '✓ Configured' : '✗ Missing'}`);
  log(`Serper API: ${config.serper.apiKey ? '✓ Configured' : '✗ Missing'}`);
  log(`Database: ${config.database.url ? '✓ Configured' : '✗ Not set'}`);
  log(`Reddit OAuth: ${config.reddit.enabled ? '✓ Configured' : '✗ Not configured (UI required)'}`);
}