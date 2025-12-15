/**
 * Base provider interface for AI providers
 */

import { AIProviderResponse } from './types';

export interface ProviderAdapter {
  name: string;
  generateResponse(prompt: string, options: GenerationOptions): Promise<AIProviderResponse>;
  validateKey(apiKey: string): Promise<boolean>;
  estimateTokens(text: string): number;
}

export interface GenerationOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  userId?: string;
  systemPrompt?: string;
}

/**
 * Abstract base class for provider adapters
 */
export abstract class BaseProviderAdapter implements ProviderAdapter {
  abstract name: string;
  
  constructor(protected apiKey: string) {}
  
  abstract generateResponse(prompt: string, options: GenerationOptions): Promise<AIProviderResponse>;
  abstract validateKey(apiKey: string): Promise<boolean>;
  abstract estimateTokens(text: string): number;
  
  /**
   * Common retry logic with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    baseDelayMs = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === maxRetries) {
          break;
        }
        
        // Exponential backoff with jitter
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
  
  /**
   * Calculate cost based on token usage
   */
  protected calculateCost(tokensUsed: number, provider: string, feature: string): number {
    // Simplified pricing - in production, use actual provider pricing
    const rates: Record<string, Record<string, number>> = {
      openai: {
        reasoning: 0.0005 / 1000000, // $0.5 per 1M tokens
        summary: 0.0003 / 1000000,
        expansion: 0.0004 / 1000000,
      },
      gemini: {
        reasoning: 0.0004 / 1000000, // $0.4 per 1M tokens
        summary: 0.0002 / 1000000,
        expansion: 0.0003 / 1000000,
      },
      anthropic: {
        reasoning: 0.001 / 1000000,  // $1.0 per 1M tokens
        summary: 0.0008 / 1000000,
        expansion: 0.0009 / 1000000,
      },
    };
    
    const rate = rates[provider]?.[feature] || 0;
    return tokensUsed * rate;
  }
}