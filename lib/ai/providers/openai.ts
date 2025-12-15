/**
 * OpenAI provider adapter
 */

import OpenAI from 'openai';
import { BaseProviderAdapter, GenerationOptions } from './base';
import { AIProviderResponse } from '../types';

export class OpenAIAdapter extends BaseProviderAdapter {
  name = 'openai';
  private client: OpenAI;
  
  constructor(apiKey: string) {
    super(apiKey);
    this.client = new OpenAI({
      apiKey: this.apiKey,
    });
  }
  
  async generateResponse(prompt: string, options: GenerationOptions = {}): Promise<AIProviderResponse> {
    const { model = 'gpt-4o-mini', maxTokens = 4000, temperature = 0.7, systemPrompt } = options;
    
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt,
    });
    
    const response = await this.retryWithBackoff(async () => {
      const completion = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        response_format: { type: 'json_object' },
      });
      
      const content = completion.choices[0]?.message?.content || '';
      const tokensUsed = completion.usage?.total_tokens || 0;
      
      return {
        content,
        tokensUsed,
        provider: this.name,
        model,
      };
    });
    
    return response;
  }
  
  async validateKey(apiKey: string): Promise<boolean> {
    try {
      const testClient = new OpenAI({ apiKey });
      await testClient.models.list();
      return true;
    } catch {
      return false;
    }
  }
  
  estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }
}