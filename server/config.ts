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
  serper: {
    apiKey: string;
  };
  database: {
    url?: string;
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
  
  if (!serperApiKey) {
    throw new Error(
      `Missing Serper API key. Please set one of these environment variables:
      - SERPER_API_KEY (preferred)
      - SERPER_TOKEN (fallback)
      
      Get your API key from: https://serper.dev/`
    );
  }
  
  return {
    nodeEnv,
    port: parseInt(process.env.PORT || '5000', 10),
    host: process.env.HOST || '0.0.0.0',
    openai: {
      apiKey: openaiApiKey
    },
    serper: {
      apiKey: serperApiKey
    },
    database: {
      url: process.env.DATABASE_URL
    }
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
  log(`Serper API: ${config.serper.apiKey ? '✓ Configured' : '✗ Missing'}`);
  log(`Database: ${config.database.url ? '✓ Configured' : '✗ Not set'}`);
}