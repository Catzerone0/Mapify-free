/**
 * Text connector - handles plain text paste
 */
import { BaseConnector } from './base';
import type { ExtractedContent, TextPayload } from '../types';
import { TextPayloadSchema } from '../validation';
import { normalizeWhitespace } from '../chunker';

export class TextConnector extends BaseConnector {
  async extract(payload: TextPayload): Promise<ExtractedContent> {
    const validated = TextPayloadSchema.parse(payload);
    const normalizedText = normalizeWhitespace(validated.text);

    return this.createExtractedContent(
      normalizedText,
      {
        title: validated.title || 'Text Input',
        timestamp: new Date().toISOString(),
        wordCount: normalizedText.split(/\s+/).length,
      },
      []
    );
  }

  async validate(payload: TextPayload): Promise<boolean> {
    try {
      TextPayloadSchema.parse(payload);
      return true;
    } catch {
      return false;
    }
  }
}
