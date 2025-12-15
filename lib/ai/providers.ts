/**
 * AI provider configuration and interface
 */

import { ProviderConfig } from './types';

export const AI_PROVIDERS: Record<string, ProviderConfig> = {
  openai: {
    name: 'openai',
    models: {
      reasoning: 'gpt-4o-mini',
      summary: 'gpt-4o-mini',
      expansion: 'gpt-4o-mini',
    },
    maxTokens: {
      reasoning: 4000,
      summary: 1000,
      expansion: 2000,
    },
    defaultTemperature: 0.7,
    supportedFeatures: ['reasoning', 'summary', 'expansion', 'citations'],
  },
  gemini: {
    name: 'gemini',
    models: {
      reasoning: 'gemini-1.5-flash',
      summary: 'gemini-1.5-flash',
      expansion: 'gemini-1.5-flash',
    },
    maxTokens: {
      reasoning: 4000,
      summary: 1000,
      expansion: 2000,
    },
    defaultTemperature: 0.7,
    supportedFeatures: ['reasoning', 'summary', 'expansion', 'citations'],
  },
  anthropic: {
    name: 'anthropic',
    models: {
      reasoning: 'claude-3-5-sonnet-latest',
      summary: 'claude-3-5-sonnet-latest',
      expansion: 'claude-3-5-sonnet-latest',
    },
    maxTokens: {
      reasoning: 4000,
      summary: 1000,
      expansion: 2000,
    },
    defaultTemperature: 0.7,
    supportedFeatures: ['reasoning', 'summary', 'expansion', 'citations'],
  },
};

/**
 * Provider status and availability check
 */
export interface ProviderStatus {
  available: boolean;
  error?: string;
  lastChecked: Date;
}

const providerStatusCache = new Map<string, ProviderStatus>();

/**
 * Get provider status with caching
 */
export async function getProviderStatus(provider: string): Promise<ProviderStatus> {
  const cached = providerStatusCache.get(provider);
  const now = new Date();
  
  // Return cached result if less than 5 minutes old
  if (cached && now.getTime() - cached.lastChecked.getTime() < 5 * 60 * 1000) {
    return cached;
  }
  
  const status: ProviderStatus = {
    available: false,
    lastChecked: now,
  };
  
  try {
    // Check if provider config exists
    if (!AI_PROVIDERS[provider]) {
      status.error = `Unknown provider: ${provider}`;
      providerStatusCache.set(provider, status);
      return status;
    }
    
    // For now, assume providers are available if configured
    // In production, you might want to make actual API calls to check availability
    status.available = true;
    providerStatusCache.set(provider, status);
    
  } catch (error) {
    status.available = false;
    status.error = error instanceof Error ? error.message : 'Unknown error';
    providerStatusCache.set(provider, status);
  }
  
  return status;
}

/**
 * Get default provider based on availability and user preferences
 */
export async function getDefaultProvider(userId?: string, preferredProvider?: string): Promise<string> {
  // If user has a preferred provider and it's available, use it
  if (preferredProvider) {
    const status = await getProviderStatus(preferredProvider);
    if (status.available) {
      return preferredProvider;
    }
  }
  
  // Check each provider in order of preference
  for (const providerName of Object.keys(AI_PROVIDERS)) {
    const status = await getProviderStatus(providerName);
    if (status.available) {
      return providerName;
    }
  }
  
  throw new Error('No AI providers are available');
}

/**
 * Validate provider and feature support
 */
export function validateProviderRequest(provider: string, feature: string): { valid: boolean; error?: string } {
  const config = AI_PROVIDERS[provider];
  if (!config) {
    return { valid: false, error: `Unknown provider: ${provider}` };
  }
  
  if (!config.supportedFeatures.includes(feature)) {
    return { valid: false, error: `Provider ${provider} does not support feature: ${feature}` };
  }
  
  return { valid: true };
}

/**
 * Get provider configuration
 */
export function getProviderConfig(provider: string): ProviderConfig {
  const config = AI_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }
  return config!;
}

/**
 * Get model configuration for a provider and feature
 */
export function getModelConfig(provider: string, feature: 'reasoning' | 'summary' | 'expansion'): {
  model: string;
  maxTokens: number;
  temperature: number;
} {
  const config = getProviderConfig(provider);
  return {
    model: config.models[feature],
    maxTokens: config.maxTokens[feature],
    temperature: config.defaultTemperature,
  };
}

/**
 * Estimate cost for a generation request
 */
export function estimateCost(provider: string, feature: 'reasoning' | 'summary' | 'expansion', estimatedTokens: number): {
  estimatedCost: number;
  currency: string;
  breakdown: Record<string, number>;
} {
  // Pricing per 1K tokens (approximate rates)
  const pricing: Record<string, Record<string, number>> = {
    openai: {
      reasoning: 0.0005, // $0.5 per 1M tokens
      summary: 0.0003,   // $0.3 per 1M tokens
      expansion: 0.0004, // $0.4 per 1M tokens
    },
    gemini: {
      reasoning: 0.0004, // $0.4 per 1M tokens
      summary: 0.0002,   // $0.2 per 1M tokens
      expansion: 0.0003, // $0.3 per 1M tokens
    },
    anthropic: {
      reasoning: 0.001,  // $1.0 per 1M tokens
      summary: 0.0008,   // $0.8 per 1M tokens
      expansion: 0.0009, // $0.9 per 1M tokens
    },
  };
  
  const rate = pricing[provider]?.[feature] || 0;
  const estimatedCost = (estimatedTokens / 1000) * rate;
  
  return {
    estimatedCost,
    currency: 'USD',
    breakdown: {
      tokens: estimatedTokens,
      rate: rate * 1000000, // Rate per 1M tokens
      cost: estimatedCost,
    },
  };
}