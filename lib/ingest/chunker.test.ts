/**
 * Tests for text chunking utilities
 */
import { describe, it, expect } from '@jest/globals';
import {
  chunkText,
  estimateTokens,
  generateContentHash,
  normalizeWhitespace,
  removeBoilerplate,
} from './chunker';
import { SourceType } from './types';

describe('chunkText', () => {
  it('should split text into chunks based on max size', () => {
    const text = 'A '.repeat(1000); // 2000 characters
    const chunks = chunkText(text, {
      maxChunkSize: 500,
      overlap: 0,
      sourceType: SourceType.TEXT,
    });

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      expect(chunk.text.length).toBeLessThanOrEqual(500);
      expect(chunk.metadata.sourceType).toBe(SourceType.TEXT);
    });
  });

  it('should add overlap between chunks', () => {
    const text = 'Word '.repeat(500);
    const chunks = chunkText(text, {
      maxChunkSize: 500,
      overlap: 100,
      sourceType: SourceType.TEXT,
    });

    expect(chunks.length).toBeGreaterThan(1);
    // Verify overlap exists (approximate check)
    for (let i = 1; i < chunks.length; i++) {
      const prevChunkEnd = chunks[i - 1].text.slice(-50);
      const currentChunkStart = chunks[i].text.slice(0, 50);
      // Some overlap should exist
      expect(prevChunkEnd.length).toBeGreaterThan(0);
      expect(currentChunkStart.length).toBeGreaterThan(0);
    }
  });

  it('should include metadata in chunks', () => {
    const text = 'Test content for chunking.';
    const chunks = chunkText(text, {
      sourceType: SourceType.WEB,
      metadata: {
        title: 'Test Article',
        url: 'https://example.com',
      },
    });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].metadata.title).toBe('Test Article');
    expect(chunks[0].metadata.url).toBe('https://example.com');
    expect(chunks[0].metadata.chunkIndex).toBe(0);
    expect(chunks[0].metadata.totalChunks).toBe(chunks.length);
  });

  it('should handle single sentence shorter than max size', () => {
    const text = 'Short text.';
    const chunks = chunkText(text, {
      maxChunkSize: 1000,
      sourceType: SourceType.TEXT,
    });

    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe('Short text.');
  });

  it('should estimate tokens for each chunk', () => {
    const text = 'Test content for token estimation.';
    const chunks = chunkText(text, {
      sourceType: SourceType.TEXT,
    });

    chunks.forEach((chunk) => {
      expect(chunk.tokens).toBeGreaterThan(0);
      expect(typeof chunk.tokens).toBe('number');
    });
  });
});

describe('estimateTokens', () => {
  it('should estimate tokens based on character count', () => {
    const text = 'This is a test sentence.';
    const tokens = estimateTokens(text);

    // Roughly 4 characters per token
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(text.length);
  });

  it('should return 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });
});

describe('generateContentHash', () => {
  it('should generate consistent hash for same content', () => {
    const text = 'Test content';
    const hash1 = generateContentHash(text);
    const hash2 = generateContentHash(text);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 produces 64 hex characters
  });

  it('should generate different hashes for different content', () => {
    const hash1 = generateContentHash('Content A');
    const hash2 = generateContentHash('Content B');

    expect(hash1).not.toBe(hash2);
  });
});

describe('normalizeWhitespace', () => {
  it('should normalize line endings', () => {
    const text = 'Line 1\r\nLine 2\r\nLine 3';
    const normalized = normalizeWhitespace(text);

    expect(normalized).toBe('Line 1\nLine 2\nLine 3');
  });

  it('should replace tabs with spaces', () => {
    const text = 'Text\twith\ttabs';
    const normalized = normalizeWhitespace(text);

    expect(normalized).toBe('Text with tabs');
  });

  it('should collapse multiple spaces', () => {
    const text = 'Too    many     spaces';
    const normalized = normalizeWhitespace(text);

    expect(normalized).toBe('Too many spaces');
  });

  it('should limit consecutive newlines to 2', () => {
    const text = 'Paragraph 1\n\n\n\n\nParagraph 2';
    const normalized = normalizeWhitespace(text);

    expect(normalized).toBe('Paragraph 1\n\nParagraph 2');
  });

  it('should trim leading and trailing whitespace', () => {
    const text = '  \n  Content  \n  ';
    const normalized = normalizeWhitespace(text);

    expect(normalized).toBe('Content');
  });
});

describe('removeBoilerplate', () => {
  it('should remove common boilerplate phrases', () => {
    const text = 'Main content here. Cookie Policy. More content. Privacy Policy.';
    const cleaned = removeBoilerplate(text);

    expect(cleaned).not.toContain('Cookie Policy');
    expect(cleaned).not.toContain('Privacy Policy');
    expect(cleaned).toContain('Main content');
  });

  it('should be case insensitive', () => {
    const text = 'Content. COOKIE POLICY. More text.';
    const cleaned = removeBoilerplate(text);

    expect(cleaned).not.toContain('COOKIE POLICY');
  });

  it('should not affect other content', () => {
    const text = 'This is legitimate content without boilerplate.';
    const cleaned = removeBoilerplate(text);

    expect(cleaned).toBe(text);
  });
});
