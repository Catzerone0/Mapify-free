/**
 * YouTube connector - fetches video transcripts
 */
import { YoutubeTranscript } from 'youtube-transcript';
import { BaseConnector } from './base';
import type { ExtractedContent, YouTubePayload, Citation } from '../types';
import { YouTubePayloadSchema, extractYouTubeVideoId } from '../validation';
import { normalizeWhitespace } from '../chunker';

export class YouTubeConnector extends BaseConnector {
  async extract(payload: YouTubePayload): Promise<ExtractedContent> {
    const validated = YouTubePayloadSchema.parse(payload);
    const videoId = extractYouTubeVideoId(validated.url) || validated.videoId;

    if (!videoId) {
      throw new Error('Invalid YouTube URL or video ID');
    }

    // Fetch transcript with retry
    const transcript = await this.retryWithBackoff(
      async () => await YoutubeTranscript.fetchTranscript(videoId),
      3,
      1000
    );

    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript available for this video');
    }

    // Combine transcript segments
    const text = transcript.map((segment) => segment.text).join(' ');
    const normalizedText = normalizeWhitespace(text);

    // Try to fetch video metadata
    const metadata = await this.fetchVideoMetadata(videoId);

    const citation: Citation = {
      title: metadata.title || `YouTube Video ${videoId}`,
      url: validated.url,
      author: metadata.author,
      timestamp: new Date().toISOString(),
    };

    return this.createExtractedContent(
      normalizedText,
      {
        title: metadata.title || `YouTube Video ${videoId}`,
        url: validated.url,
        author: metadata.author,
        timestamp: new Date().toISOString(),
        wordCount: normalizedText.split(/\s+/).length,
      },
      [citation]
    );
  }

  async validate(payload: YouTubePayload): Promise<boolean> {
    try {
      YouTubePayloadSchema.parse(payload);
      const videoId = extractYouTubeVideoId(payload.url) || payload.videoId;
      return !!videoId;
    } catch {
      return false;
    }
  }

  private async fetchVideoMetadata(
    videoId: string
  ): Promise<{ title?: string; author?: string }> {
    try {
      // Simple metadata extraction from oEmbed API
      const response = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );

      if (!response.ok) {
        return {};
      }

      const data = await response.json();
      return {
        title: data.title,
        author: data.author_name,
      };
    } catch {
      // Fallback: metadata not available
      return {};
    }
  }
}
