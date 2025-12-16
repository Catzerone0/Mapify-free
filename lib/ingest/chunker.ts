/**
 * Text chunking utilities for content ingestion
 */
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import type { ContentChunk, ChunkMetadata, SourceType } from './types';
import { CHUNK_CONFIG } from './types';

export interface ChunkOptions {
  maxChunkSize?: number;
  overlap?: number;
  sourceType: SourceType;
  metadata?: Partial<ChunkMetadata>;
}

/**
 * Split text into chunks with overlap for better context preservation
 */
export function chunkText(text: string, options: ChunkOptions): ContentChunk[] {
  const maxChunkSize = options.maxChunkSize || CHUNK_CONFIG.MAX_CHUNK_SIZE;
  const overlap = options.overlap || CHUNK_CONFIG.OVERLAP;

  // Split by sentences for better semantic boundaries
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: ContentChunk[] = [];
  let currentChunk = '';
  let previousChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();

    // If single sentence exceeds max size, split by words
    if (trimmedSentence.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(createChunk(currentChunk, options, chunks.length));
        previousChunk = currentChunk;
        currentChunk = '';
      }

      const words = trimmedSentence.split(/\s+/);
      let wordChunk = '';

      for (const word of words) {
        if ((wordChunk + ' ' + word).length > maxChunkSize) {
          chunks.push(createChunk(wordChunk, options, chunks.length));
          previousChunk = wordChunk;
          wordChunk = word;
        } else {
          wordChunk = wordChunk ? wordChunk + ' ' + word : word;
        }
      }

      if (wordChunk) {
        currentChunk = wordChunk;
      }
      continue;
    }

    // Add sentence to current chunk
    if ((currentChunk + ' ' + trimmedSentence).length > maxChunkSize) {
      chunks.push(createChunk(currentChunk, options, chunks.length));
      previousChunk = currentChunk;

      // Add overlap from previous chunk
      const overlapText = getOverlapText(previousChunk, overlap);
      currentChunk = overlapText ? overlapText + ' ' + trimmedSentence : trimmedSentence;
    } else {
      currentChunk = currentChunk
        ? currentChunk + ' ' + trimmedSentence
        : trimmedSentence;
    }
  }

  // Add remaining chunk
  if (currentChunk) {
    chunks.push(createChunk(currentChunk, options, chunks.length));
  }

  // Update total chunks count in metadata
  return chunks.map((chunk, index) => ({
    ...chunk,
    metadata: {
      ...chunk.metadata,
      chunkIndex: index,
      totalChunks: chunks.length,
    },
  }));
}

function createChunk(
  text: string,
  options: ChunkOptions,
  index: number
): ContentChunk {
  return {
    id: uuidv4(),
    text: text.trim(),
    metadata: {
      ...options.metadata,
      chunkIndex: index,
      totalChunks: 0, // Will be updated later
      sourceType: options.sourceType,
    } as ChunkMetadata,
    tokens: estimateTokens(text),
  };
}

function getOverlapText(text: string, overlapSize: number): string {
  if (text.length <= overlapSize) return text;

  // Get last N characters but try to break at sentence/word boundary
  const overlapText = text.slice(-overlapSize);
  const sentenceMatch = overlapText.match(/[.!?]\s+(.+)$/);
  if (sentenceMatch) {
    return sentenceMatch[1];
  }

  const wordMatch = overlapText.match(/\s+(.+)$/);
  if (wordMatch) {
    return wordMatch[1];
  }

  return overlapText;
}

/**
 * Rough token estimation (4 chars per token on average)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Generate content hash for deduplication
 */
export function generateContentHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Normalize whitespace in text
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\t/g, ' ') // Replace tabs with spaces
    .replace(/ +/g, ' ') // Collapse multiple spaces
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .trim();
}

/**
 * Remove boilerplate text commonly found in web pages
 */
export function removeBoilerplate(text: string): string {
  const boilerplatePatterns = [
    /cookie policy/gi,
    /privacy policy/gi,
    /terms of service/gi,
    /subscribe to our newsletter/gi,
    /follow us on/gi,
    /share this article/gi,
  ];

  let cleaned = text;
  for (const pattern of boilerplatePatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned;
}
