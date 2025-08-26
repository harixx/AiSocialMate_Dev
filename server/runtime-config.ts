/**
 * Runtime API Key Management System
 * Allows API keys to be set and updated dynamically without restart
 * Now with persistent storage using Replit Database
 */

interface RuntimeAPIKeys {
  openai?: string;
  gemini?: string;
  serper?: string;
  redditClientId?: string; // Added for Reddit
  redditClientSecret?: string; // Added for Reddit
  redditUsername?: string; // Added for Reddit
  redditPassword?: string; // Added for Reddit
}

interface APIKeyStatus {
  openai: boolean;
  gemini: boolean;
  serper: boolean;
}

class RuntimeConfigManager {
  private apiKeys: RuntimeAPIKeys = {};
  private defaultKeys: RuntimeAPIKeys = {};
  private db: any = null;
  private dbInitialized: boolean = false;

  constructor() {
    // Load any environment variables as defaults but don't require them
    this.defaultKeys = {
      openai: process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY || process.env.OPENAI_TOKEN,
      gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
      serper: process.env.SERPER_API_KEY || process.env.SERPER_TOKEN
    };

    // Initialize runtime keys with defaults if available
    this.apiKeys = { ...this.defaultKeys };

    // Initialize database and load persisted keys
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      const Database = await import('@replit/database');
      this.db = new Database.default();
      this.dbInitialized = true;
      console.log('✅ Runtime Config: Replit Database initialized');

      // Load persisted keys from database after initialization
      await this.loadPersistedKeys();
    } catch (error) {
      console.log('⚠️ Runtime Config: Database not available, using memory only');
      this.dbInitialized = false;
    }
  }

  private async loadPersistedKeys() {
    if (!this.db || !this.dbInitialized) return;

    try {
      const persistedKeys = await this.db.get('runtime_api_keys');
      if (persistedKeys) {
        console.log('🔑 Loading persisted API keys from database');
        this.apiKeys = { ...this.defaultKeys, ...persistedKeys };
        console.log('✅ Persisted API keys loaded successfully');
      }
    } catch (error) {
      console.log('⚠️ Failed to load persisted API keys:', error);
    }
  }

  private async saveToDatabase() {
    if (!this.db || !this.dbInitialized) {
      console.log('⚠️ Database not ready, skipping save');
      return;
    }
    
    // Double-check db methods exist
    if (typeof this.db.set !== 'function') {
      console.error('❌ Database set method not available');
      return;
    }

    try {
      // Only save non-default keys to database
      const keysToSave: RuntimeAPIKeys = {};

      if (this.apiKeys.openai && this.apiKeys.openai !== this.defaultKeys.openai) {
        keysToSave.openai = this.apiKeys.openai;
      }
      if (this.apiKeys.gemini && this.apiKeys.gemini !== this.defaultKeys.gemini) {
        keysToSave.gemini = this.apiKeys.gemini;
      }
      if (this.apiKeys.serper && this.apiKeys.serper !== this.defaultKeys.serper) {
        keysToSave.serper = this.apiKeys.serper;
      }
      // Save Reddit credentials if they are set and not just defaults
      if (this.apiKeys.redditClientId && this.apiKeys.redditClientId !== this.defaultKeys.redditClientId) {
        keysToSave.redditClientId = this.apiKeys.redditClientId;
      }
      if (this.apiKeys.redditClientSecret && this.apiKeys.redditClientSecret !== this.defaultKeys.redditClientSecret) {
        keysToSave.redditClientSecret = this.apiKeys.redditClientSecret;
      }
      if (this.apiKeys.redditUsername && this.apiKeys.redditUsername !== this.defaultKeys.redditUsername) {
        keysToSave.redditUsername = this.apiKeys.redditUsername;
      }
      if (this.apiKeys.redditPassword && this.apiKeys.redditPassword !== this.defaultKeys.redditPassword) {
        keysToSave.redditPassword = this.apiKeys.redditPassword;
      }


      await this.db.set('runtime_api_keys', keysToSave);
      console.log('💾 API keys saved to persistent storage');
    } catch (error) {
      console.log('⚠️ Failed to save API keys to database:', error);
    }
  }

  /**
   * Set a runtime API key
   */
  async setAPIKey(service: keyof RuntimeAPIKeys, key: string): Promise<void> {
    this.apiKeys[service] = key;
    console.log(`✅ Runtime API key updated for ${service}`);
    await this.saveToDatabase(); // Persist to database
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
      openai: !!(this.getAPIKey('openai')),
      gemini: !!(this.getAPIKey('gemini')),
      serper: !!(this.getAPIKey('serper'))
    };
  }

  /**
   * Update multiple API keys at once
   */
  async updateAPIKeys(keys: Partial<RuntimeAPIKeys>): Promise<void> {
    Object.entries(keys).forEach(([service, key]) => {
      if (key !== undefined && key !== null && key.trim()) {
        this.apiKeys[service as keyof RuntimeAPIKeys] = key.trim();
      }
    });
    console.log('✅ Multiple runtime API keys updated');
    await this.saveToDatabase(); // Persist to database
  }

  /**
   * Remove a runtime API key (falls back to default if available)
   */
  async removeAPIKey(service: keyof RuntimeAPIKeys): Promise<void> {
    delete this.apiKeys[service];
    console.log(`🗑️ Runtime API key removed for ${service}, falling back to default`);
    await this.saveToDatabase(); // Persist to database
  }

  /**
   * Clear all runtime API keys (falls back to defaults)
   */
  async clearAllAPIKeys(): Promise<void> {
    this.apiKeys = { ...this.defaultKeys };
    console.log('🗑️ All runtime API keys cleared, using defaults');
    await this.saveToDatabase(); // Persist to database
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
export async function createOpenAIClient(customApiKey?: string): Promise<OpenAI> {
  const apiKey = customApiKey || runtimeConfig.getAPIKey('openai');

  if (!apiKey) {
    throw new Error('OpenAI API key not available. Please set it in the API Settings.');
  }

  // Clean the API key first (remove any extra whitespace or hidden characters)
  const cleanApiKey = apiKey.trim().replace(/[^\w-]/g, '');

  // Validate API key format after cleaning
  if (!cleanApiKey.startsWith('sk-') || cleanApiKey.length < 50) {
    throw new Error('Invalid OpenAI API key format. Please check your API key and try again.');
  }

  // Dynamically import OpenAI only when needed
  const { default: OpenAI } = await import('openai');

  return new OpenAI({
    apiKey: cleanApiKey
  });
}

/**
 * Create Gemini client with runtime key
 */
export async function createGeminiClient(customKey?: string) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const apiKey = getAPIKey('gemini', customKey);

  if (!apiKey) {
    throw new Error('Gemini API key not available. Please set it in the API Settings.');
  }

  return new GoogleGenerativeAI(apiKey);
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

/**
 * Set Reddit credentials
 */
export function setRedditCredentials(clientId: string, clientSecret: string, username?: string, password?: string): void {
  runtimeConfig.updateAPIKeys({
    redditClientId: clientId,
    redditClientSecret: clientSecret,
    redditUsername: username,
    redditPassword: password
  });
}

/**
 * Get Reddit credentials (for external use)
 */
export function getRedditCredentials(): { clientId?: string; clientSecret?: string; username?: string; password?: string } {
  return {
    clientId: runtimeConfig.getAPIKey('redditClientId'),
    clientSecret: runtimeConfig.getAPIKey('redditClientSecret'),
    username: runtimeConfig.getAPIKey('redditUsername'),
    password: runtimeConfig.getAPIKey('redditPassword')
  };
}

// Add methods to RuntimeConfigManager class
declare module "./runtime-config" {
  interface RuntimeConfigManager {
    getRedditCredentials(): { clientId?: string; clientSecret?: string; username?: string; password?: string };
    setRedditCredentials(clientId: string, clientSecret: string, username?: string, password?: string): Promise<void>;
    clearRedditCredentials(): Promise<void>;
  }
}

// Extend the RuntimeConfigManager class
RuntimeConfigManager.prototype.getRedditCredentials = function() {
  return {
    clientId: this.getAPIKey('redditClientId'),
    clientSecret: this.getAPIKey('redditClientSecret'),
    username: this.getAPIKey('redditUsername'),
    password: this.getAPIKey('redditPassword')
  };
};

RuntimeConfigManager.prototype.setRedditCredentials = async function(clientId: string, clientSecret: string, username?: string, password?: string) {
  await this.updateAPIKeys({
    redditClientId: clientId,
    redditClientSecret: clientSecret,
    redditUsername: username,
    redditPassword: password
  });
  console.log('✅ Reddit credentials saved successfully');
};

RuntimeConfigManager.prototype.clearRedditCredentials = async function() {
  await Promise.all([
    this.removeAPIKey('redditClientId'),
    this.removeAPIKey('redditClientSecret'),
    this.removeAPIKey('redditUsername'),
    this.removeAPIKey('redditPassword')
  ]);
  console.log('🗑️ Reddit credentials cleared');
};