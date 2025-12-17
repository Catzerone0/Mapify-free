/**
 * Main AI orchestration service for mind map generation
 */

import { db } from '@/lib/db';
import { OpenAIAdapter } from './providers/openai';
import { GeminiAdapter } from './providers/gemini';
import { ProviderAdapter } from './providers/base';
import { generatePrompt } from './templates';
import { validateMindMap } from './validation';
import { 
  GenerationRequest, 
  ExpansionRequest, 
  SummarizationRequest,
  GenerationResult,
  ExpansionResult,
  SummarizationResult,
  MindMapData,
  MapNodeData
} from './types';
import { getDefaultProvider, getProviderConfig, validateProviderRequest } from './providers';
import { decryptApiKey } from '@/lib/encryption';

export class AIMapEngine {
  private providers: Map<string, ProviderAdapter> = new Map();
  
  constructor() {
    this.initializeProviders();
  }
  
  private initializeProviders() {
    // Providers will be initialized dynamically when needed
  }
  
  /**
   * Get or create a provider adapter
   */
  private async getProviderAdapter(provider: string, userId: string): Promise<ProviderAdapter> {
    if (this.providers.has(provider)) {
      return this.providers.get(provider)!;
    }
    
    // Get user's API key for this provider
    const userKey = await db.userProviderKey.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });
    
    if (!userKey) {
      throw new Error(`No API key found for provider ${provider}`);
    }
    
    const apiKey = decryptApiKey(userKey.encryptedKey);
    let adapter: ProviderAdapter;
    
    switch (provider) {
      case 'openai':
        adapter = new OpenAIAdapter(apiKey);
        break;
      case 'gemini':
        adapter = new GeminiAdapter(apiKey);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
    
    // Validate the API key
    const isValid = await adapter.validateKey(apiKey);
    if (!isValid) {
      throw new Error(`Invalid API key for provider ${provider}`);
    }
    
    this.providers.set(provider, adapter);
    return adapter;
  }
  
  /**
   * Main mind map generation pipeline
   */
  async generateMindMap(request: GenerationRequest): Promise<GenerationResult> {
    try {
      // Determine provider
      const provider = request.provider || await getDefaultProvider(request.userId);
      const providerValidation = validateProviderRequest(provider, 'reasoning');
      if (!providerValidation.valid) {
        throw new Error(providerValidation.error);
      }
      
      const adapter = await this.getProviderAdapter(provider, request.userId);
      
      // Create generation job record
      const job = await db.generationJob.create({
        data: {
          prompt: request.prompt,
          provider,
          status: 'pending',
          result: undefined,
          error: undefined,
        },
      });
      
      // Update job status to processing
      await db.generationJob.update({
        where: { id: job.id },
        data: { 
          status: 'processing',
          startedAt: new Date(),
        },
      });
      
      try {
        // Generate prompt
        const complexity = request.complexity || 'moderate';
        const variables = {
          prompt: request.prompt,
          sources: request.sources?.join('\n\n') || '',
          instructions: request.existingMapId ? 
            'This is an expansion or refinement of an existing mind map. Consider the current structure.' : 
            'Create a comprehensive mind map from scratch.',
        };
        
        const { systemPrompt, userPrompt } = generatePrompt('mindmap-reasoning', variables, complexity);
        
        // Call AI provider
        const response = await adapter.generateResponse(userPrompt, {
          systemPrompt,
          model: getProviderConfig(provider).models.reasoning,
          maxTokens: getProviderConfig(provider).maxTokens.reasoning,
          temperature: 0.7,
        });
        
        // Parse and validate the response
        let parsedData: MindMapData;
        try {
          const jsonResponse = JSON.parse(response.content) as unknown;
          
          // Validate structure
          const validation = validateMindMap(jsonResponse);
          if (!validation.isValid) {
            throw new Error(`Invalid mind map structure: ${validation.errors.join(', ')}`);
          }
          
          parsedData = jsonResponse as MindMapData;
        } catch (parseError) {
          throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
        }
        
        // Save to database
        await this.saveMindMapToDatabase(parsedData, request);
        
        // Update generation job with success
        await db.generationJob.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            result: JSON.parse(JSON.stringify(parsedData)),
            tokensUsed: response.tokensUsed,
            completedAt: new Date(),
          },
        });
        
        return {
          success: true,
          data: parsedData,
          tokensUsed: response.tokensUsed,
          provider: response.provider,
        };
      } catch (generationError) {
        // Update job with error
        await db.generationJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error: generationError instanceof Error ? generationError.message : 'Generation failed',
          },
        });
        
        throw generationError;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Expand an existing node with more detail
   */
  async expandNode(mindMapId: string, request: ExpansionRequest): Promise<ExpansionResult> {
    try {
      const provider = request.provider || 'openai';
      const adapter = await this.getProviderAdapter(provider, request.userId);
      
      // Get the existing node
      const existingNode = await db.mapNode.findUnique({
        where: { id: request.nodeId },
        include: {
          children: true,
          citations: true,
        },
      });
      
      if (!existingNode) {
        throw new Error(`Node not found: ${request.nodeId}`);
      }
      
      // Get context from parent
      const parentContext = `Node in mind map expansion with ${existingNode.children?.length || 0} existing children`;
      
      // Create generation job
      const job = await db.generationJob.create({
        data: {
          nodeId: request.nodeId,
          prompt: `Expand node: ${existingNode.title || existingNode.content.substring(0, 100)}`,
          provider,
          status: 'pending',
        },
      });
      
      await db.generationJob.update({
        where: { id: job.id },
        data: { 
          status: 'processing',
          startedAt: new Date(),
        },
      });
      
      try {
        const complexity = request.complexity || 'moderate';
        const variables = {
          nodeTitle: existingNode.title || 'Untitled',
          nodeContent: existingNode.content,
          parentContext,
          focusPrompt: request.prompt || 'Provide comprehensive coverage of this topic',
          instructions: `Expand with ${request.depth || 2} levels of depth.`,
        };
        
        const { systemPrompt, userPrompt } = generatePrompt('node-expansion', variables, complexity);
        
        const response = await adapter.generateResponse(userPrompt, {
          systemPrompt,
          model: getProviderConfig(provider).models.expansion,
          maxTokens: getProviderConfig(provider).maxTokens.expansion,
          temperature: 0.7,
        });
        
        let parsedData: { title?: string; content?: string; children?: MapNodeData[] };
        try {
          parsedData = JSON.parse(response.content);
        } catch (parseError) {
          throw new Error(`Failed to parse expansion response: ${parseError}`);
        }
        
        // Update the existing node if title/content changed
        if (parsedData.title || parsedData.content) {
          await db.mapNode.update({
            where: { id: request.nodeId },
            data: {
              title: parsedData.title || existingNode.title,
              content: parsedData.content || existingNode.content,
              updatedAt: new Date(),
            },
          });
        }
        
        // Create child nodes if provided
        let createdChildren: MapNodeData[] = [];
        if (parsedData.children && parsedData.children.length > 0) {
          // Get mindMapId from existingNode
          const parentNode = await db.mapNode.findUnique({
            where: { id: request.nodeId },
            select: { mindMapId: true },
          });
          
          if (parentNode) {
            createdChildren = await this.createChildNodes(
              parsedData.children,
              request.nodeId,
              parentNode.mindMapId,
              existingNode.level + 1
            );
          }
        }
        
        await db.generationJob.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            result: JSON.parse(JSON.stringify({
              updatedNode: {
                id: request.nodeId,
                ...parsedData,
              },
              createdChildren,
            })),
            tokensUsed: response.tokensUsed,
            completedAt: new Date(),
          },
        });
        
        return {
          success: true,
          data: {
            id: request.nodeId,
            title: parsedData.title || existingNode.title || undefined,
            content: parsedData.content || existingNode.content,
            level: existingNode.level,
            order: existingNode.order,
            visual: {
              x: existingNode.x,
              y: existingNode.y,
              width: existingNode.width,
              height: existingNode.height,
              color: existingNode.color || undefined,
              shape: existingNode.shape as 'rectangle' | 'circle' | 'diamond' | 'hexagon',
              isCollapsed: existingNode.isCollapsed,
            },
            citations: [],
            children: createdChildren,
          },
          tokensUsed: response.tokensUsed,
          provider: response.provider,
        };
      } catch (expansionError) {
        await db.generationJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error: expansionError instanceof Error ? expansionError.message : 'Expansion failed',
          },
        });
        throw expansionError;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Generate summary for an existing mind map
   */
  async summarizeMindMap(request: SummarizationRequest): Promise<SummarizationResult> {
    try {
      const provider = request.provider || 'openai';
      const adapter = await this.getProviderAdapter(provider, request.userId);
      
      // Get the mind map structure
      const mindMap = await db.mindMap.findUnique({
        where: { id: request.mindMapId },
        include: {
          nodes: {
            include: {
              children: true,
            },
          },
        },
      });
      
      if (!mindMap) {
        throw new Error(`Mind map not found: ${request.mindMapId}`);
      }
      
      // Create generation job
      const job = await db.generationJob.create({
        data: {
          mindMapId: request.mindMapId,
          prompt: `Summarize mind map: ${mindMap.title}`,
          provider,
          status: 'pending',
        },
      });
      
      await db.generationJob.update({
        where: { id: job.id },
        data: { 
          status: 'processing',
          startedAt: new Date(),
        },
      });
      
      try {
        // Build structure representation
        const rootNodes = mindMap.nodes.filter(node => !node.parentId);
        const structure = this.buildStructureString(rootNodes, 0);
        
        const variables = {
          mapTitle: mindMap.title,
          mapStructure: structure,
          focusAreas: 'all areas',
          summaryLength: 'comprehensive',
          summaryStyle: 'analytical and insightful',
        };
        
        const { systemPrompt, userPrompt } = generatePrompt('map-summarization', variables, 'moderate');
        
        const response = await adapter.generateResponse(userPrompt, {
          systemPrompt,
          model: getProviderConfig(provider).models.summary,
          maxTokens: getProviderConfig(provider).maxTokens.summary,
          temperature: 0.5,
        });
        
        // Update mind map with generated summary
        await db.mindMap.update({
          where: { id: request.mindMapId },
          data: {
            summary: response.content,
            updatedAt: new Date(),
          },
        });
        
        await db.generationJob.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            result: { summary: response.content },
            tokensUsed: response.tokensUsed,
            completedAt: new Date(),
          },
        });
        
        return {
          success: true,
          summary: response.content,
          tokensUsed: response.tokensUsed,
          provider: response.provider,
        };
      } catch (summarizationError) {
        await db.generationJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error: summarizationError instanceof Error ? summarizationError.message : 'Summarization failed',
          },
        });
        throw summarizationError;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Save generated mind map to database
   */
  private async saveMindMapToDatabase(data: MindMapData, request: GenerationRequest): Promise<string> {
    const mindMap = await db.mindMap.create({
      data: {
        title: data.title,
        description: data.description,
        summary: data.summary,
        prompt: request.prompt,
        provider: data.provider,
        complexity: data.complexity,
        workspaceId: request.workspaceId,
      },
    });
    
    // Save root nodes
    for (const nodeData of data.rootNodes) {
      await this.createNodeRecursive(nodeData, mindMap.id, null, 0);
    }
    
    return mindMap.id;
  }
  
  /**
   * Create a node and its children recursively
   */
  private async createNodeRecursive(
    nodeData: MapNodeData,
    mindMapId: string,
    parentId: string | null,
    level: number
  ): Promise<void> {
    const node = await db.mapNode.create({
      data: {
        mindMapId,
        title: nodeData.title,
        content: nodeData.content,
        parentId,
        x: nodeData.visual.x,
        y: nodeData.visual.y,
        width: nodeData.visual.width,
        height: nodeData.visual.height,
        color: nodeData.visual.color,
        shape: nodeData.visual.shape,
        level,
        order: nodeData.order,
        isCollapsed: nodeData.visual.isCollapsed,
      },
    });
    
    // Save citations
    for (const citation of nodeData.citations) {
      await db.nodeCitation.create({
        data: {
          nodeId: node.id,
          title: citation.title,
          url: citation.url,
          summary: citation.summary,
          author: citation.author,
        },
      });
    }
    
    // Create children recursively
    if (nodeData.children) {
      for (const childData of nodeData.children) {
        await this.createNodeRecursive(childData, mindMapId, node.id, level + 1);
      }
    }
  }
  
  /**
   * Create child nodes from expansion result
   */
  private async createChildNodes(
    childrenData: MapNodeData[],
    parentId: string,
    mindMapId: string,
    level: number
  ): Promise<MapNodeData[]> {
    const created: MapNodeData[] = [];
    
    for (const [index, childData] of childrenData.entries()) {
      const node = await db.mapNode.create({
        data: {
          mindMapId,
          title: childData.title,
          content: childData.content,
          parentId,
          x: childData.visual.x,
          y: childData.visual.y,
          width: childData.visual.width,
          height: childData.visual.height,
          color: childData.visual.color,
          shape: childData.visual.shape,
          level,
          order: index,
          isCollapsed: childData.visual.isCollapsed,
        },
      });
      
      const createdNode: MapNodeData = {
        id: node.id,
        title: node.title || undefined,
        content: node.content,
        level: node.level,
        order: node.order,
        visual: {
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          color: node.color || undefined,
          shape: node.shape as 'rectangle' | 'circle' | 'diamond' | 'hexagon',
          isCollapsed: node.isCollapsed,
        },
        citations: [],
        children: childData.children || [],
      };
      
      // Save citations
      for (const citation of childData.citations) {
        await db.nodeCitation.create({
          data: {
            nodeId: node.id,
            title: citation.title,
            url: citation.url,
            summary: citation.summary,
            author: citation.author,
          },
        });
      }
      
      created.push(createdNode);
    }
    
    return created;
  }
  
  /**
   * Build a string representation of the mind map structure
   */
  private buildStructureString(nodes: unknown[], level: number): string {
    let result = '';
    const indent = '  '.repeat(level);
    
    for (const node of nodes) {
      const n = node as { title?: string | null; content?: string; children?: unknown[] };
      if (!n || typeof n !== 'object') continue;
      
      const title = n.title || 'Untitled';
      const content = n.content || '';
      result += `${indent}- ${title}: ${content.substring(0, 100)}...\\n`;
      
      if (n.children && Array.isArray(n.children) && n.children.length > 0) {
        result += this.buildStructureString(n.children, level + 1);
      }
    }
    
    return result;
  }
  
  /**
   * Regenerate a specific node and its subtree
   */
  async regenerateNode(mindMapId: string, request: ExpansionRequest): Promise<ExpansionResult> {
    try {
      const provider = request.provider || 'openai';
      const adapter = await this.getProviderAdapter(provider, request.userId);
      
      // Get the existing node
      const existingNode = await db.mapNode.findUnique({
        where: { id: request.nodeId },
        include: {
          children: true,
          citations: true,
        },
      });
      
      if (!existingNode) {
        throw new Error(`Node not found: ${request.nodeId}`);
      }
      
      // Create generation job
      const job = await db.generationJob.create({
        data: {
          nodeId: request.nodeId,
          prompt: `Regenerate node: ${existingNode.title || existingNode.content.substring(0, 100)}`,
          provider,
          status: 'pending',
        },
      });
      
      await db.generationJob.update({
        where: { id: job.id },
        data: { 
          status: 'processing',
          startedAt: new Date(),
        },
      });
      
      try {
        const complexity = request.complexity || 'moderate';
        const parentContext = `Node in mind map regeneration with ${existingNode.children?.length || 0} existing children`;
        
        const variables = {
          nodeTitle: existingNode.title || 'Untitled',
          nodeContent: existingNode.content,
          parentContext,
          focusPrompt: request.prompt || 'Provide a comprehensive and accurate representation of this topic',
          instructions: `Regenerate this node with improved clarity and detail while maintaining the same depth level.`,
        };
        
        const { systemPrompt, userPrompt } = generatePrompt('node-regeneration', variables, complexity);
        
        const response = await adapter.generateResponse(userPrompt, {
          systemPrompt,
          model: getProviderConfig(provider).models.reasoning,
          maxTokens: getProviderConfig(provider).maxTokens.reasoning,
          temperature: 0.7,
        });
        
        let parsedData: { title?: string; content?: string; children?: MapNodeData[] };
        try {
          parsedData = JSON.parse(response.content);
        } catch (parseError) {
          throw new Error(`Failed to parse regeneration response: ${parseError}`);
        }
        
        // Update the existing node
        await db.mapNode.update({
          where: { id: request.nodeId },
          data: {
            title: parsedData.title || existingNode.title,
            content: parsedData.content || existingNode.content,
            updatedAt: new Date(),
          },
        });
        
        // If new children are provided, replace the existing children
        let createdChildren: MapNodeData[] = [];
        if (parsedData.children && parsedData.children.length > 0) {
          // Delete existing children
          await db.mapNode.deleteMany({
            where: { parentId: request.nodeId },
          });
          
          // Get mindMapId from existingNode
          const parentNode = await db.mapNode.findUnique({
            where: { id: request.nodeId },
            select: { mindMapId: true },
          });
          
          if (parentNode) {
            // Create new children
            createdChildren = await this.createChildNodes(
              parsedData.children,
              request.nodeId,
              parentNode.mindMapId,
              existingNode.level + 1
            );
          }
        }
        
        await db.generationJob.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            result: JSON.parse(JSON.stringify({
              updatedNode: {
                id: request.nodeId,
                ...parsedData,
              },
              createdChildren,
            })),
            tokensUsed: response.tokensUsed,
            completedAt: new Date(),
          },
        });
        
        return {
          success: true,
          data: {
            id: request.nodeId,
            title: parsedData.title || existingNode.title || undefined,
            content: parsedData.content || existingNode.content,
            level: existingNode.level,
            order: existingNode.order,
            visual: {
              x: existingNode.x,
              y: existingNode.y,
              width: existingNode.width,
              height: existingNode.height,
              color: existingNode.color || undefined,
              shape: existingNode.shape as 'rectangle' | 'circle' | 'diamond' | 'hexagon',
              isCollapsed: existingNode.isCollapsed,
            },
            citations: [],
            children: createdChildren,
          },
          tokensUsed: response.tokensUsed,
          provider: response.provider,
        };
      } catch (regenerationError) {
        await db.generationJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error: regenerationError instanceof Error ? regenerationError.message : 'Regeneration failed',
          },
        });
        throw regenerationError;
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}