/**
 * Web connector - fetches and extracts content from web pages
 */
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { BaseConnector } from './base';
import type { ExtractedContent, WebPayload, Citation } from '../types';
import { WebPayloadSchema } from '../validation';
import { normalizeWhitespace, removeBoilerplate } from '../chunker';
import { SIZE_LIMITS } from '../types';

export class WebConnector extends BaseConnector {
  async extract(payload: WebPayload): Promise<ExtractedContent> {
    const validated = WebPayloadSchema.parse(payload);

    // Fetch HTML with retry
    const html = await this.retryWithBackoff(
      async () => await this.fetchHTML(validated.url),
      3,
      2000
    );

    // Parse with Readability
    const article = this.extractArticle(html, validated.url);

    if (!article || !article.textContent) {
      throw new Error('Failed to extract readable content from web page');
    }

    // Clean and normalize text
    let text = normalizeWhitespace(article.textContent);
    text = removeBoilerplate(text);

    const citation: Citation = {
      title: article.title || validated.url,
      url: validated.url,
      author: article.byline || undefined,
      excerpt: article.excerpt || undefined,
    };

    return this.createExtractedContent(
      text,
      {
        title: article.title || validated.url,
        url: validated.url,
        author: article.byline || undefined,
        timestamp: new Date().toISOString(),
      },
      [citation]
    );
  }

  async validate(payload: WebPayload): Promise<boolean> {
    try {
      WebPayloadSchema.parse(payload);
      return true;
    } catch {
      return false;
    }
  }

  private async fetchHTML(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; MindMapBot/1.0; +https://mindmap.app)',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch web page: ${response.status} ${response.statusText}`
      );
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > SIZE_LIMITS.WEB) {
      throw new Error(
        `Web page too large. Maximum size: ${SIZE_LIMITS.WEB / (1024 * 1024)}MB`
      );
    }

    return await response.text();
  }

  private extractArticle(
    html: string,
    url: string
  ): ReturnType<Readability['parse']> | null {
    try {
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      return reader.parse();
    } catch (error) {
      throw new Error(`Failed to parse web page: ${(error as Error).message}`);
    }
  }
}
