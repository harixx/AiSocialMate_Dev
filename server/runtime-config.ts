/**
 * Runtime API Key Management System
 * Allows API keys to be set and updated dynamically without restart
 */

interface RuntimeAPIKeys {
  openai?: string;
  gemini?: string;
  serper?: string;
}

interface APIKeyStatus {
  openai: boolean;
  gemini: boolean;
  serper: boolean;
}

class RuntimeConfigManager {
  private apiKeys: RuntimeAPIKeys = {};
  private defaultKeys: RuntimeAPIKeys = {};

  constructor() {
    // Load any environment variables as defaults but don't require them
    this.defaultKeys = {
      openai: process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY || process.env.OPENAI_TOKEN,
      gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
      serper: process.env.SERPER_API_KEY || process.env.SERPER_TOKEN
    };

    // Initialize runtime keys with defaults if available
    this.apiKeys = { ...this.defaultKeys };
  }

  /**
   * Set a runtime API key
   */
  setAPIKey(service: keyof RuntimeAPIKeys, key: string): void {
    this.apiKeys[service] = key;
    console.log(`✅ Runtime API key updated for ${service}`);
  }

  /**
   * Get the current API key for a service (runtime first, then default)
   */
  getAPIKey(service: keyof RuntimeAPIKeys): string | undefined {
    return this.apiKeys[service] || this.defaultKeys[service];
  }

  /**
   * Get all current API keys (masked for security)
   */
  getAPIKeyStatus(): APIKeyStatus {
    return {
      openai: !!(this.apiKeys.openai || this.defaultKeys.openai),
      gemini: !!(this.apiKeys.gemini || this.defaultKeys.gemini),
      serper: !!(this.apiKeys.serper || this.defaultKeys.serper)
    };
  }

  /**
   * Update multiple API keys at once
   */
  updateAPIKeys(keys: Partial<RuntimeAPIKeys>): void {
    Object.entries(keys).forEach(([service, key]) => {
      if (key && key.trim()) {
        this.apiKeys[service as keyof RuntimeAPIKeys] = key.trim();
      }
    });
    console.log('✅ Multiple runtime API keys updated');
  }

  /**
   * Remove a runtime API key (falls back to default if available)
   */
  removeAPIKey(service: keyof RuntimeAPIKeys): void {
    delete this.apiKeys[service];
    console.log(`🗑️ Runtime API key removed for ${service}, falling back to default`);
  }

  /**
   * Clear all runtime API keys (falls back to defaults)
   */
  clearAllAPIKeys(): void {
    this.apiKeys = {};
    console.log('🗑️ All runtime API keys cleared, using defaults');
  }

  /**
   * Check if any API keys are available
   */
  hasRequiredKeys(): { openai: boolean; gemini: boolean; serper: boolean } {
    return {
      openai: !!(this.getAPIKey('openai')),
      gemini: !!(this.getAPIKey('gemini')),
      serper: !!(this.getAPIKey('serper'))
    };
  }
}

// Global runtime configuration manager
export const runtimeConfig = new RuntimeConfigManager();

/**
 * Get API key for a service with optional override
 */
export function getAPIKey(service: keyof RuntimeAPIKeys, override?: string): string | undefined {
  return override || runtimeConfig.getAPIKey(service);
}

/**
 * Create OpenAI client with runtime key
 */
export function createOpenAIClient(customKey?: string) {
  const OpenAI = require('openai').default;
  const apiKey = getAPIKey('openai', customKey);
  
  if (!apiKey) {
    throw new Error('OpenAI API key not available. Please set it in the API Settings.');
  }
  
  return new OpenAI({ apiKey });
}

/**
 * Create Gemini client with runtime key
 */
export function createGeminiClient(customKey?: string) {
  const { GoogleGenAI } = require('@google/genai');
  const apiKey = getAPIKey('gemini', customKey);
  
  if (!apiKey) {
    throw new Error('Gemini API key not available. Please set it in the API Settings.');
  }
  
  return new GoogleGenAI({ apiKey });
}

/**
 * Get Serper API key with runtime fallback
 */
export function getSerperAPIKey(customKey?: string): string {
  const apiKey = getAPIKey('serper', customKey);
  
  if (!apiKey) {
    throw new Error('Serper API key not available. Please set it in the API Settings.');
  }
  
  return apiKey;
}