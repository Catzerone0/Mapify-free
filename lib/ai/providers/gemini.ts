/**
 * Gemini provider adapter
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseProviderAdapter, GenerationOptions } from './base';
import { AIProviderResponse } from '../types';

export class GeminiAdapter extends BaseProviderAdapter {
  name = 'gemini';
  private client: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    super(apiKey);
    this.client = new GoogleGenerativeAI(this.apiKey);
  }
  
  async generateResponse(prompt: string, options: GenerationOptions = {}): Promise<AIProviderResponse> {
    const { model = 'gemini-1.5-flash', maxTokens = 4000, temperature = 0.7, systemPrompt } = options;
    
    try {
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      
      const result = await this.retryWithBackoff(async () => {
        const modelInstance = this.client.getGenerativeModel({ model });
        
        const response = await modelInstance.generateContent({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            responseMimeType: 'application/json',
          },
        });
        
        const responseText = response.response.text();
        const tokensUsed = response.usageMetadata?.totalTokenCount || 0;
        
        return {
          content: responseText,
          tokensUsed,
          provider: this.name,
          model,
        };
      });
      
      return result;
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new GoogleGenerativeAI(apiKey);
      const model = testClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
      await model.generateContent('Hello');
      return true;
    } catch {
      return false;
    }
  }
  
  estimateTokens(text: string): number {
    // Rough estimation for Gemini: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }
}