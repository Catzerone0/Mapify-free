/**
 * Validation schemas for content ingestion
 */
import { z } from 'zod';
import { SourceType } from './types';

export const TextPayloadSchema = z.object({
  text: z.string().min(1).max(1024 * 1024), // Max 1MB of text
  title: z.string().optional(),
});

export const YouTubePayloadSchema = z.object({
  url: z.string().url(),
  videoId: z.string().min(1),
});

export const PDFPayloadSchema = z.object({
  filename: z.string().min(1),
  fileUrl: z.string().url().optional(),
  fileBuffer: z.any().optional(), // Can't validate Buffer directly
});

export const WebPayloadSchema = z.object({
  url: z.string().url(),
});

export const WebSearchPayloadSchema = z.object({
  query: z.string().min(1).max(500),
  maxResults: z.number().int().min(1).max(10).optional().default(5),
});

export const IngestRequestSchema = z.object({
  sourceType: z.nativeEnum(SourceType),
  payload: z.any(), // Will be validated based on sourceType
  workspaceId: z.string().cuid(),
});

export function validatePayload(sourceType: SourceType, payload: unknown): boolean {
  try {
    switch (sourceType) {
      case SourceType.TEXT:
        TextPayloadSchema.parse(payload);
        break;
      case SourceType.YOUTUBE:
        YouTubePayloadSchema.parse(payload);
        break;
      case SourceType.PDF:
        PDFPayloadSchema.parse(payload);
        break;
      case SourceType.WEB:
        WebPayloadSchema.parse(payload);
        break;
      case SourceType.WEBSEARCH:
        WebSearchPayloadSchema.parse(payload);
        break;
      default:
        return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
