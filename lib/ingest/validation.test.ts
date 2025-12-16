/**
 * Tests for validation utilities
 */
import { describe, it, expect } from '@jest/globals';
import { validatePayload, extractYouTubeVideoId } from './validation';
import { SourceType } from './types';

describe('validatePayload', () => {
  describe('TEXT source', () => {
    it('should validate valid text payload', () => {
      const payload = {
        text: 'This is test content',
        title: 'Test Title',
      };

      expect(validatePayload(SourceType.TEXT, payload)).toBe(true);
    });

    it('should validate text without title', () => {
      const payload = {
        text: 'Content without title',
      };

      expect(validatePayload(SourceType.TEXT, payload)).toBe(true);
    });

    it('should reject empty text', () => {
      const payload = {
        text: '',
      };

      expect(validatePayload(SourceType.TEXT, payload)).toBe(false);
    });

    it('should reject missing text field', () => {
      const payload = {
        title: 'No text field',
      };

      expect(validatePayload(SourceType.TEXT, payload)).toBe(false);
    });
  });

  describe('YOUTUBE source', () => {
    it('should validate valid YouTube payload', () => {
      const payload = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoId: 'dQw4w9WgXcQ',
      };

      expect(validatePayload(SourceType.YOUTUBE, payload)).toBe(true);
    });

    it('should reject invalid URL', () => {
      const payload = {
        url: 'not-a-url',
        videoId: 'dQw4w9WgXcQ',
      };

      expect(validatePayload(SourceType.YOUTUBE, payload)).toBe(false);
    });

    it('should reject missing videoId', () => {
      const payload = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };

      expect(validatePayload(SourceType.YOUTUBE, payload)).toBe(false);
    });
  });

  describe('PDF source', () => {
    it('should validate PDF payload with filename', () => {
      const payload = {
        filename: 'document.pdf',
        fileUrl: 'https://example.com/document.pdf',
      };

      expect(validatePayload(SourceType.PDF, payload)).toBe(true);
    });

    it('should reject missing filename', () => {
      const payload = {
        fileUrl: 'https://example.com/document.pdf',
      };

      expect(validatePayload(SourceType.PDF, payload)).toBe(false);
    });
  });

  describe('WEB source', () => {
    it('should validate valid web URL', () => {
      const payload = {
        url: 'https://example.com/article',
      };

      expect(validatePayload(SourceType.WEB, payload)).toBe(true);
    });

    it('should reject invalid URL', () => {
      const payload = {
        url: 'not-a-valid-url',
      };

      expect(validatePayload(SourceType.WEB, payload)).toBe(false);
    });
  });

  describe('WEBSEARCH source', () => {
    it('should validate valid search query', () => {
      const payload = {
        query: 'artificial intelligence',
        maxResults: 5,
      };

      expect(validatePayload(SourceType.WEBSEARCH, payload)).toBe(true);
    });

    it('should validate query without maxResults (uses default)', () => {
      const payload = {
        query: 'machine learning',
      };

      expect(validatePayload(SourceType.WEBSEARCH, payload)).toBe(true);
    });

    it('should reject empty query', () => {
      const payload = {
        query: '',
      };

      expect(validatePayload(SourceType.WEBSEARCH, payload)).toBe(false);
    });

    it('should reject maxResults out of range', () => {
      const payload = {
        query: 'test query',
        maxResults: 100, // Max is 10
      };

      expect(validatePayload(SourceType.WEBSEARCH, payload)).toBe(false);
    });
  });
});

describe('extractYouTubeVideoId', () => {
  it('should extract video ID from standard watch URL', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const videoId = extractYouTubeVideoId(url);

    expect(videoId).toBe('dQw4w9WgXcQ');
  });

  it('should extract video ID from short URL', () => {
    const url = 'https://youtu.be/dQw4w9WgXcQ';
    const videoId = extractYouTubeVideoId(url);

    expect(videoId).toBe('dQw4w9WgXcQ');
  });

  it('should extract video ID from embed URL', () => {
    const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    const videoId = extractYouTubeVideoId(url);

    expect(videoId).toBe('dQw4w9WgXcQ');
  });

  it('should extract video ID from /v/ URL', () => {
    const url = 'https://www.youtube.com/v/dQw4w9WgXcQ';
    const videoId = extractYouTubeVideoId(url);

    expect(videoId).toBe('dQw4w9WgXcQ');
  });

  it('should return null for invalid URL', () => {
    const url = 'https://example.com/not-youtube';
    const videoId = extractYouTubeVideoId(url);

    expect(videoId).toBeNull();
  });

  it('should handle URLs with additional parameters', () => {
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s';
    const videoId = extractYouTubeVideoId(url);

    expect(videoId).toBe('dQw4w9WgXcQ');
  });
});
