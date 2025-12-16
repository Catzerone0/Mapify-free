/**
 * PDF connector - extracts text from PDF files
 */
import pdfParse from 'pdf-parse';
import { BaseConnector } from './base';
import type { ExtractedContent, PDFPayload, Citation } from '../types';
import { PDFPayloadSchema } from '../validation';
import { normalizeWhitespace } from '../chunker';
import { SIZE_LIMITS } from '../types';

export class PDFConnector extends BaseConnector {
  async extract(payload: PDFPayload): Promise<ExtractedContent> {
    const validated = PDFPayloadSchema.parse(payload);

    let buffer: Buffer;

    if (validated.fileBuffer) {
      buffer = validated.fileBuffer;
    } else if (validated.fileUrl) {
      buffer = await this.fetchPDFFromURL(validated.fileUrl);
    } else {
      throw new Error('Either fileBuffer or fileUrl must be provided');
    }

    // Check size limit
    if (buffer.length > SIZE_LIMITS.PDF) {
      throw new Error(
        `PDF file too large. Maximum size: ${SIZE_LIMITS.PDF / (1024 * 1024)}MB`
      );
    }

    // Parse PDF with retry
    const data = await this.retryWithBackoff(
      async () => await pdfParse(buffer),
      2,
      1000
    );

    const normalizedText = normalizeWhitespace(data.text);

    const citation: Citation = {
      title: validated.filename,
      url: validated.fileUrl,
    };

    return this.createExtractedContent(
      normalizedText,
      {
        title: validated.filename,
        url: validated.fileUrl,
        timestamp: new Date().toISOString(),
        pageCount: data.numpages,
      },
      [citation]
    );
  }

  async validate(payload: PDFPayload): Promise<boolean> {
    try {
      const validated = PDFPayloadSchema.parse(payload);
      return !!(validated.fileBuffer || validated.fileUrl);
    } catch {
      return false;
    }
  }

  private async fetchPDFFromURL(url: string): Promise<Buffer> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch PDF from URL: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
