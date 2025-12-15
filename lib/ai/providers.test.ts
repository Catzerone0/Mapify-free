/**
 * Unit tests for AI provider configuration and selection
 */

import { 
  AI_PROVIDERS,
  validateProviderRequest,
  getModelConfig,
  estimateCost
} from '@/lib/ai/providers';

describe('AI Provider Configuration', () => {
  describe('Provider Configuration', () => {
    it('should have all required providers configured', () => {
      expect(AI_PROVIDERS).toHaveProperty('openai');
      expect(AI_PROVIDERS).toHaveProperty('gemini');
      expect(AI_PROVIDERS).toHaveProperty('anthropic');
    });

    it('should have valid provider structure', () => {
      const openai = AI_PROVIDERS.openai;
      expect(openai.models).toHaveProperty('reasoning');
      expect(openai.maxTokens).toHaveProperty('reasoning');
      expect(openai.supportedFeatures).toContain('reasoning');
    });

    it('should have consistent max tokens and models', () => {
      for (const config of Object.values(AI_PROVIDERS)) {
        expect(config.models.reasoning).toBeDefined();
        expect(config.maxTokens.reasoning).toBeGreaterThan(0);
        expect(config.models.summary).toBeDefined();
        expect(config.maxTokens.summary).toBeGreaterThan(0);
        expect(config.models.expansion).toBeDefined();
        expect(config.maxTokens.expansion).toBeGreaterThan(0);
      }
    });
  });

  describe('Provider Validation', () => {
    it('should validate valid provider requests', () => {
      const result = validateProviderRequest('openai', 'reasoning');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid providers', () => {
      const result = validateProviderRequest('invalid-provider', 'reasoning');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown provider');
    });

    it('should reject unsupported features', () => {
      const result = validateProviderRequest('openai', 'unsupported-feature');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not support feature');
    });
  });

  describe('Model Configuration', () => {
    it('should get model config for reasoning', () => {
      const config = getModelConfig('openai', 'reasoning');
      expect(config.model).toBe('gpt-4o-mini');
      expect(config.maxTokens).toBeGreaterThan(0);
      expect(config.temperature).toBeDefined();
    });

    it('should get model config for summary', () => {
      const config = getModelConfig('gemini', 'summary');
      expect(config.model).toBe('gemini-1.5-flash');
      expect(config.maxTokens).toBeGreaterThan(0);
    });

    it('should get model config for expansion', () => {
      const config = getModelConfig('anthropic', 'expansion');
      expect(config.model).toBe('claude-3-5-sonnet-latest');
      expect(config.maxTokens).toBeGreaterThan(0);
    });

    it('should throw error for unknown provider', () => {
      expect(() => getModelConfig('unknown-provider', 'reasoning')).toThrow();
    });
  });

  describe('Cost Estimation', () => {
    it('should estimate cost for OpenAI reasoning', () => {
      const cost = estimateCost('openai', 'reasoning', 1000);
      expect(cost.estimatedCost).toBeGreaterThan(0);
      expect(cost.currency).toBe('USD');
      expect(cost.breakdown).toHaveProperty('tokens');
      expect(cost.breakdown).toHaveProperty('rate');
      expect(cost.breakdown).toHaveProperty('cost');
    });

    it('should estimate cost for different providers', () => {
      const openaiCost = estimateCost('openai', 'reasoning', 1000);
      const geminiCost = estimateCost('gemini', 'reasoning', 1000);
      
      expect(openaiCost.estimatedCost).not.toBe(geminiCost.estimatedCost);
    });

    it('should handle unknown providers gracefully', () => {
      const cost = estimateCost('unknown-provider', 'reasoning', 1000);
      expect(cost.estimatedCost).toBe(0);
    });
  });
});