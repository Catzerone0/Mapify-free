/**
 * Content ingestion types and interfaces
 */

export enum SourceType {
  TEXT = 'text',
  YOUTUBE = 'youtube',
  PDF = 'pdf',
  WEB = 'web',
  WEBSEARCH = 'websearch',
}

export enum IngestionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ContentChunk {
  id: string;
  text: string;
  metadata: ChunkMetadata;
  tokens?: number;
}

export interface ChunkMetadata {
  title?: string;
  url?: string;
  timestamp?: string | number;
  author?: string;
  startPage?: number;
  endPage?: number;
  chunkIndex: number;
  totalChunks: number;
  sourceType: SourceType;
}

export interface Citation {
  title: string;
  url?: string;
  author?: string;
  timestamp?: string;
  excerpt?: string;
}

export interface ProcessedContent {
  chunks: ContentChunk[];
  summary: string;
  wordCount: number;
  citations: Citation[];
}

// Raw payloads for different source types
export interface TextPayload {
  text: string;
  title?: string;
}

export interface YouTubePayload {
  url: string;
  videoId: string;
}

export interface PDFPayload {
  filename: string;
  fileUrl?: string;
  fileBuffer?: Buffer;
}

export interface WebPayload {
  url: string;
}

export interface WebSearchPayload {
  query: string;
  maxResults?: number;
}

export type SourcePayload =
  | TextPayload
  | YouTubePayload
  | PDFPayload
  | WebPayload
  | WebSearchPayload;

// Connector interface
export interface ContentConnector {
  extract(payload: SourcePayload): Promise<ExtractedContent>;
  validate(payload: SourcePayload): Promise<boolean>;
}

export interface ExtractedContent {
  text: string;
  metadata: {
    title?: string;
    url?: string;
    author?: string;
    timestamp?: string;
    wordCount: number;
    [key: string]: unknown;
  };
  citations: Citation[];
}

// Size limits (in bytes)
export const SIZE_LIMITS = {
  TEXT: 1024 * 1024, // 1MB
  PDF: 10 * 1024 * 1024, // 10MB
  WEB: 5 * 1024 * 1024, // 5MB
  YOUTUBE: 2 * 1024 * 1024, // 2MB
  WEBSEARCH: 5 * 1024 * 1024, // 5MB
};

// Chunk size configuration
export const CHUNK_CONFIG = {
  MAX_CHUNK_SIZE: 1000, // ~1000 tokens per chunk
  OVERLAP: 200, // Overlap between chunks
};
