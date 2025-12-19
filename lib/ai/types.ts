/**
 * Canonical mind-map data contract and utility types
 */

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'detailed' | 'expert';

export interface Citation {
  id?: string;
  title: string;
  url?: string;
  summary?: string;
  author?: string;
  createdAt?: Date;
}

export interface VisualMetadata {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  shape: 'rectangle' | 'circle' | 'diamond' | 'hexagon';
  isCollapsed: boolean;
}

export interface MapNodeData {
  id?: string;
  title?: string;
  content: string; // Rich text content, summary, or expanded details
  parentId?: string;
  level: number; // Depth in hierarchy (0 = root)
  order: number; // Order among siblings
  visual: VisualMetadata;
  citations: Citation[];
  children?: MapNodeData[];
}

export interface MindMapData {
  id?: string;
  title: string;
  description?: string;
  summary?: string;
  prompt?: string;
  provider?: string;
  complexity: ComplexityLevel;
  rootNodes: MapNodeData[];
  metadata: {
    totalNodes: number;
    maxDepth: number;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

export interface GenerationRequest {
  prompt: string;
  sources?: string[]; // Optional content sources to incorporate
  complexity?: ComplexityLevel;
  provider?: 'openai' | 'gemini' | 'anthropic';
  userId: string;
  workspaceId: string;
  existingMapId?: string;
  expandNodeId?: string;
  style?: 'hierarchical' | 'radial' | 'mindmap' | 'flowchart';
  depth?: number;
  includeCitations?: boolean;
  autoSummarize?: boolean;
  language?: string;
}

export interface ExpansionRequest {
  nodeId: string;
  prompt?: string;
  depth?: number;
  complexity?: ComplexityLevel;
  provider?: 'openai' | 'gemini' | 'anthropic';
  userId: string;
}

export interface SummarizationRequest {
  mindMapId: string;
  provider?: 'openai' | 'gemini' | 'anthropic';
  userId: string;
}

export interface AIProviderResponse {
  content: string;
  tokensUsed: number;
  provider: string;
  model: string;
}

export interface GenerationResult {
  success: boolean;
  data?: MindMapData;
  error?: string;
  tokensUsed?: number;
  provider?: string;
}

export interface ExpansionResult {
  success: boolean;
  data?: MapNodeData;
  error?: string;
  tokensUsed?: number;
  provider?: string;
}

export interface SummarizationResult {
  success: boolean;
  summary?: string;
  error?: string;
  tokensUsed?: number;
  provider?: string;
}

// Utility types for validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Provider configuration
export interface ProviderConfig {
  name: string;
  models: {
    reasoning: string;
    summary: string;
    expansion: string;
  };
  maxTokens: {
    reasoning: number;
    summary: number;
    expansion: number;
  };
  defaultTemperature: number;
  supportedFeatures: string[];
}

// Job queue types
export interface JobData {
  type: 'generate' | 'expand' | 'summarize';
  request: GenerationRequest | ExpansionRequest | SummarizationRequest;
  userId: string;
  jobId: string;
}

export interface JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  tokensUsed?: number;
}

// Token accounting
export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
  cost: number;
  provider: string;
  model: string;
}