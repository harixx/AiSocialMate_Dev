/**
 * Runtime API Key Management System
 * Allows API keys to be set and updated dynamically without restart
 * Now with persistent storage using Replit Database
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
  private db: any = null;

  constructor() {
    // Initialize Replit Database
    this.initializeDatabase();

    // Load any environment variables as defaults but don't require them
    this.defaultKeys = {
      openai: process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY || process.env.OPENAI_TOKEN,
      gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
      serper: process.env.SERPER_API_KEY || process.env.SERPER_TOKEN
    };

    // Initialize runtime keys with defaults if available
    this.apiKeys = { ...this.defaultKeys };

    // Load persisted keys from database
    this.loadPersistedKeys();
  }

  private async initializeDatabase() {
    try {
      const Database = await import('@replit/database');
      this.db = Database.default;
      console.log('✅ Runtime Config: Replit Database initialized');
    } catch (error) {
      console.log('⚠️ Runtime Config: Database not available, using memory only');
    }
  }

  private async loadPersistedKeys() {
    if (!this.db) return;

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
    if (!this.db) return;

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

      await this.db.set('runtime_api_keys', keysToSave);
      console.log('💾 API keys saved to persistent storage');
    } catch (error) {
      console.log('⚠️ Failed to save API keys to database:', error);
    }
  }

  /**
   * Set a runtime API key
   */
  setAPIKey(service: keyof RuntimeAPIKeys, key: string): void {
    this.apiKeys[service] = key;
    console.log(`✅ Runtime API key updated for ${service}`);
    this.saveToDatabase(); // Persist to database
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
    this.saveToDatabase(); // Persist to database
  }

  /**
   * Remove a runtime API key (falls back to default if available)
   */
  removeAPIKey(service: keyof RuntimeAPIKeys): void {
    delete this.apiKeys[service];
    console.log(`🗑️ Runtime API key removed for ${service}, falling back to default`);
    this.saveToDatabase(); // Persist to database
  }

  /**
   * Clear all runtime API keys (falls back to defaults)
   */
  clearAllAPIKeys(): void {
    this.apiKeys = { ...this.defaultKeys };
    console.log('🗑️ All runtime API keys cleared, using defaults');
    this.saveToDatabase(); // Persist to database
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
export async function createOpenAIClient(customKey?: string) {
  const { default: OpenAI } = await import('openai');
  const apiKey = getAPIKey('openai', customKey);
  
  if (!apiKey) {
    throw new Error('OpenAI API key not available. Please set it in the API Settings.');
  }
  
  return new OpenAI({ apiKey });
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