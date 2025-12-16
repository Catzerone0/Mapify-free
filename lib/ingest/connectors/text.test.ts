/**
 * Tests for text connector
 */
import { describe, it, expect } from '@jest/globals';
import { TextConnector } from './text';
import type { TextPayload } from '../types';

describe('TextConnector', () => {
  const connector = new TextConnector();

  describe('validate', () => {
    it('should validate valid text payload', async () => {
      const payload: TextPayload = {
        text: 'This is test content',
        title: 'Test Title',
      };

      const isValid = await connector.validate(payload);
      expect(isValid).toBe(true);
    });

    it('should reject empty text', async () => {
      const payload: TextPayload = {
        text: '',
      };

      const isValid = await connector.validate(payload);
      expect(isValid).toBe(false);
    });

    it('should validate text without title', async () => {
      const payload: TextPayload = {
        text: 'Content without title',
      };

      const isValid = await connector.validate(payload);
      expect(isValid).toBe(true);
    });
  });

  describe('extract', () => {
    it('should extract and normalize text', async () => {
      const payload: TextPayload = {
        text: 'This is   test    content\r\n\r\nWith  multiple    spaces',
        title: 'Test Article',
      };

      const result = await connector.extract(payload);

      expect(result.text).toContain('test content');
      expect(result.text).not.toContain('  '); // Multiple spaces should be collapsed
      expect(result.metadata.title).toBe('Test Article');
      expect(result.metadata.wordCount).toBeGreaterThan(0);
    });

    it('should use default title if not provided', async () => {
      const payload: TextPayload = {
        text: 'Content without explicit title',
      };

      const result = await connector.extract(payload);

      expect(result.metadata.title).toBe('Text Input');
      expect(result.text).toBe('Content without explicit title');
    });

    it('should include timestamp in metadata', async () => {
      const payload: TextPayload = {
        text: 'Timestamped content',
      };

      const result = await connector.extract(payload);

      expect(result.metadata.timestamp).toBeDefined();
      expect(typeof result.metadata.timestamp).toBe('string');
    });

    it('should count words correctly', async () => {
      const payload: TextPayload = {
        text: 'One two three four five',
      };

      const result = await connector.extract(payload);

      expect(result.metadata.wordCount).toBe(5);
    });

    it('should handle multiline text', async () => {
      const payload: TextPayload = {
        text: 'Line one\nLine two\nLine three',
      };

      const result = await connector.extract(payload);

      expect(result.text).toContain('Line one');
      expect(result.text).toContain('Line two');
      expect(result.text).toContain('Line three');
    });

    it('should return empty citations array', async () => {
      const payload: TextPayload = {
        text: 'Test content',
      };

      const result = await connector.extract(payload);

      expect(result.citations).toEqual([]);
    });
  });
});
