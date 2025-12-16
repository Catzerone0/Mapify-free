/**
 * Web search connector - performs web searches and aggregates results
 * Supports multiple search providers: SerpAPI, Tavily, Bing
 */
import { BaseConnector } from './base';
import type { ExtractedContent, WebSearchPayload, Citation } from '../types';
import { WebSearchPayloadSchema } from '../validation';
import { normalizeWhitespace } from '../chunker';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  position: number;
}

interface SearchProvider {
  search(query: string, maxResults: number): Promise<SearchResult[]>;
  isConfigured(): boolean;
}

class SerpAPIProvider implements SearchProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.SERPAPI_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async search(query: string, maxResults: number): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error('SerpAPI API key not configured');
    }

    const params = new URLSearchParams({
      q: query,
      api_key: this.apiKey,
      num: maxResults.toString(),
    });

    const response = await fetch(
      `https://serpapi.com/search.json?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const organicResults = data.organic_results || [];

    return organicResults.map((result: Record<string, string>, index: number) => ({
      title: result.title,
      url: result.link,
      snippet: result.snippet || '',
      position: index + 1,
    }));
  }
}

class TavilyProvider implements SearchProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async search(query: string, maxResults: number): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Tavily API key not configured');
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        max_results: maxResults,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.results || [];

    return results.map((result: Record<string, string>, index: number) => ({
      title: result.title,
      url: result.url,
      snippet: result.content || '',
      position: index + 1,
    }));
  }
}

class BingProvider implements SearchProvider {
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.BING_SEARCH_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async search(query: string, maxResults: number): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Bing API key not configured');
    }

    const params = new URLSearchParams({
      q: query,
      count: maxResults.toString(),
    });

    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?${params.toString()}`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Bing API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const webPages = data.webPages?.value || [];

    return webPages.map((result: Record<string, string>, index: number) => ({
      title: result.name,
      url: result.url,
      snippet: result.snippet || '',
      position: index + 1,
    }));
  }
}

export class WebSearchConnector extends BaseConnector {
  private providers: SearchProvider[];

  constructor() {
    super();
    this.providers = [
      new TavilyProvider(),
      new SerpAPIProvider(),
      new BingProvider(),
    ];
  }

  async extract(payload: WebSearchPayload): Promise<ExtractedContent> {
    const validated = WebSearchPayloadSchema.parse(payload);
    const maxResults = validated.maxResults || 5;

    // Find first configured provider
    const provider = this.providers.find((p) => p.isConfigured());

    if (!provider) {
      throw new Error(
        'No search provider configured. Please set TAVILY_API_KEY, SERPAPI_API_KEY, or BING_SEARCH_API_KEY environment variable.'
      );
    }

    // Perform search with retry
    const results = await this.retryWithBackoff(
      async () => await provider.search(validated.query, maxResults),
      2,
      1000
    );

    if (results.length === 0) {
      throw new Error('No search results found');
    }

    // Aggregate results into text
    const text = this.aggregateResults(results);
    const citations = this.createCitations(results);

    return this.createExtractedContent(
      text,
      {
        title: `Search results for: ${validated.query}`,
        timestamp: new Date().toISOString(),
        resultCount: results.length,
        query: validated.query,
      },
      citations
    );
  }

  async validate(payload: WebSearchPayload): Promise<boolean> {
    try {
      WebSearchPayloadSchema.parse(payload);
      return this.providers.some((p) => p.isConfigured());
    } catch {
      return false;
    }
  }

  private aggregateResults(results: SearchResult[]): string {
    const sections = results.map((result) => {
      return `## ${result.title}\n\nURL: ${result.url}\n\n${result.snippet}\n`;
    });

    return normalizeWhitespace(sections.join('\n\n'));
  }

  private createCitations(results: SearchResult[]): Citation[] {
    return results.map((result) => ({
      title: result.title,
      url: result.url,
      excerpt: result.snippet,
    }));
  }
}
