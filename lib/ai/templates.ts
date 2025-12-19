/**
 * Prompt templating system for AI generation
 */

import { ComplexityLevel } from './types';

export interface PromptTemplate {
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  supportedComplexity: ComplexityLevel[];
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    name: 'mindmap-reasoning',
    description: 'Generate a comprehensive mind map structure',
    systemPrompt: `You are an expert mind map generator. Create structured, hierarchical mind maps from prompts and source materials. Follow these guidelines:

1. STRUCTURE: Create a tree-like hierarchy with clear parent-child relationships
2. CONTENT: Use concise, informative titles and rich content for each node
3. CITATIONS: Include relevant citations when source material is provided
4. COMPLEXITY: Adapt detail level based on the specified complexity
5. VALIDATION: Ensure all nodes have meaningful content and proper relationships

Always respond with valid JSON that matches the specified schema.`,
    userPromptTemplate: `Generate a mind map for the following prompt: "{prompt}"

{focusPrompt}

{complexityInstruction}

{instructions}

Return the mind map as a JSON object with the following structure:
{
  "title": "Main topic title",
  "description": "Optional brief description",
  "complexity": "{complexity}",
  "rootNodes": [...]
}

Ensure the mind map is comprehensive, well-structured, and follows the specified complexity level.`,
    supportedComplexity: ['simple', 'moderate', 'complex', 'detailed', 'expert'],
  },
  {
    name: 'node-regeneration',
    description: 'Regenerate existing mind map nodes with improved content',
    systemPrompt: `You are an expert at regenerating mind map nodes with improved clarity, accuracy, and detail. Focus on:

1. CLARITY: Make the content clearer and more understandable
2. ACCURACY: Ensure all information is factually correct
3. COMPLETENESS: Cover all important aspects of the topic
4. CONSISTENCY: Maintain the overall mind map structure and style
5. IMPROVEMENT: Enhance the node while preserving its core meaning

Always respond with valid JSON that matches the specified schema.`,
    userPromptTemplate: `Regenerate this mind map node with improved content:

Current Node:
- Title: {nodeTitle}
- Content: {nodeContent}
- Context: {parentContext}

{focusPrompt}

{instructions}

Return the regenerated node as a JSON object:
{
  "title": "Improved title",
  "content": "Enhanced content with better clarity and detail",
  "children": [
    {
      "title": "Child node title",
      "content": "Child node content",
      "visual": {
        "x": 0,
        "y": 0,
        "width": 120,
        "height": 80,
        "shape": "rectangle",
        "isCollapsed": false
      },
      "citations": [],
      "children": []
    }
  ]
}

Ensure the regenerated node maintains the same hierarchical level and improves upon the original content.`,
    supportedComplexity: ['simple', 'moderate', 'complex', 'detailed', 'expert'],
  },
  {
    name: 'node-expansion',
    description: 'Expand existing mind map nodes with additional detail',
    systemPrompt: `You are an expert at expanding mind map nodes with relevant, detailed content. Focus on:

1. RELEVANCE: Ensure expanded content directly relates to the parent node
2. HIERARCHY: Create logical sub-nodes that break down the main topic
3. DEPTH: Adjust detail level based on complexity and context
4. CONNECTIONS: Maintain clear relationships to the parent node
5. INNOVATION: Add unique insights and connections where appropriate

Always respond with valid JSON that matches the node schema.`,
    userPromptTemplate: `Expand the following mind map node:

Current Node: {nodeTitle}
Current Content: {nodeContent}
Context: {parentContext}

Focus on: {focusPrompt}
Complexity: {complexity}
Instructions: {instructions}

Generate 3-7 child nodes that expand this topic meaningfully. Return as JSON:
{
  "title": "Updated node title (optional)",
  "content": "Updated or enhanced content (optional)",
  "children": [...]
}`,
    supportedComplexity: ['simple', 'moderate', 'complex', 'detailed', 'expert'],
  },
  {
    name: 'map-summarization',
    description: 'Generate comprehensive summaries of mind maps',
    systemPrompt: `You are an expert at analyzing and summarizing complex information structures. Your task is to create clear, comprehensive summaries of mind maps that:

1. CAPTURE ESSENCE: Identify the core themes and key insights
2. MAINTAIN STRUCTURE: Preserve the hierarchical relationships in the summary
3. HIGHLIGHT CONNECTIONS: Point out important connections between branches
4. PROVIDE VALUE: Offer additional insights or implications not explicitly stated
5. STAY CONCISE: Provide thorough but digestible summaries

Always respond with clear, well-structured text.`,
    userPromptTemplate: `Create a comprehensive summary of the following mind map:

Title: {mapTitle}
Structure: {mapStructure}

Focus areas: {focusAreas}
Length: {summaryLength}
Style: {summaryStyle}

Provide a detailed summary that captures the essence, key insights, and important connections.`,
    supportedComplexity: ['simple', 'moderate', 'complex', 'detailed', 'expert'],
  },
];

/**
 * Get prompt template by name
 */
export function getPromptTemplate(templateName: string): PromptTemplate | null {
  return PROMPT_TEMPLATES.find(template => template.name === templateName) || null;
}

/**
 * Generate a complete prompt by filling in the template
 */
export function generatePrompt(
  templateName: string,
  variables: Record<string, string | undefined>,
  complexity: ComplexityLevel
): { systemPrompt: string; userPrompt: string } {
  const template = getPromptTemplate(templateName);
  if (!template) {
    throw new Error(`Unknown template: ${templateName}`);
  }
  
  if (!template.supportedComplexity.includes(complexity)) {
    throw new Error(`Template ${templateName} does not support complexity ${complexity}`);
  }
  
  const systemPrompt = template.systemPrompt;
  
  const userPrompt = template.userPromptTemplate
    .replace(/{prompt}/g, variables.prompt || '')
    .replace(/{focusPrompt}/g, variables.focusPrompt || '')
    .replace(/{complexity}/g, complexity)
    .replace(/{complexityInstruction}/g, getComplexityInstruction(complexity))
    .replace(/{instructions}/g, variables.instructions || '')
    .replace(/{nodeTitle}/g, variables.nodeTitle || '')
    .replace(/{nodeContent}/g, variables.nodeContent || '')
    .replace(/{parentContext}/g, variables.parentContext || '')
    .replace(/{mapTitle}/g, variables.mapTitle || '')
    .replace(/{mapStructure}/g, variables.mapStructure || '')
    .replace(/{focusAreas}/g, variables.focusAreas || 'all areas')
    .replace(/{summaryLength}/g, variables.summaryLength || 'detailed')
    .replace(/{summaryStyle}/g, variables.summaryStyle || 'analytical');
  
  return { systemPrompt, userPrompt };
}

/**
 * Get complexity-specific instructions
 */
function getComplexityInstruction(complexity: ComplexityLevel): string {
  switch (complexity) {
    case 'simple':
      return `COMPLEXITY: Simple - Focus on the main concepts with minimal detail. Create 2-4 top-level branches with 2-3 sub-nodes each.`;

    case 'moderate':
      return `COMPLEXITY: Moderate - Provide balanced detail with good coverage. Create 3-6 top-level branches with 3-5 sub-nodes each.`;

    case 'complex':
      return `COMPLEXITY: Complex - Include comprehensive detail and explore connections deeply. Create 4-8 top-level branches with 4-6 sub-nodes each, including cross-connections where relevant.`;

    case 'detailed':
      return `COMPLEXITY: Detailed - Provide a very thorough breakdown. Create 6-10 top-level branches with 5-8 sub-nodes each. Focus on granularity and completeness.`;

    case 'expert':
      return `COMPLEXITY: Expert - Provide professional-grade analysis with extensive depth. Create 8-12 top-level branches with multiple sub-levels. Include sophisticated concepts, terminology, and cross-references.`;
  }
}

/**
 * Validate prompt variables for a template
 */
export function validatePromptVariables(
  templateName: string,
  variables: Record<string, string | undefined>
): { valid: boolean; errors: string[] } {
  const template = getPromptTemplate(templateName);
  if (!template) {
    return { valid: false, errors: [`Unknown template: ${templateName}`] };
  }
  
  const errors: string[] = [];
  const requiredVariables = ['prompt'];
  
  // Check for required variables
  for (const required of requiredVariables) {
    if (!variables[required]?.trim()) {
      errors.push(`Missing required variable: ${required}`);
    }
  }
  
  // Template-specific validations
  if (templateName === 'node-expansion') {
    const expansionRequired = ['nodeTitle', 'nodeContent'];
    for (const required of expansionRequired) {
      if (!variables[required]?.trim()) {
        errors.push(`Missing required variable for expansion: ${required}`);
      }
    }
  }
  
  if (templateName === 'map-summarization') {
    const summaryRequired = ['mapTitle', 'mapStructure'];
    for (const required of summaryRequired) {
      if (!variables[required]?.trim()) {
        errors.push(`Missing required variable for summarization: ${required}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Estimate prompt length and token usage
 */
export function estimatePromptTokens(
  templateName: string,
  variables: Record<string, string | undefined>,
  complexity: ComplexityLevel
): { systemTokens: number; userTokens: number; totalTokens: number } {
  const { systemPrompt, userPrompt } = generatePrompt(templateName, variables, complexity);
  
  // Rough token estimation (1 token ≈ 4 characters)
  const systemTokens = Math.ceil(systemPrompt.length / 4);
  const userTokens = Math.ceil(userPrompt.length / 4);
  
  return {
    systemTokens,
    userTokens,
    totalTokens: systemTokens + userTokens,
  };
}

/**
 * Optimize variables for token limits
 */
export function optimizeVariablesForTokenLimit(
  templateName: string,
  variables: Record<string, string | undefined>,
  complexity: ComplexityLevel,
  maxTokens: number
): Record<string, string | undefined> {
  const { totalTokens } = estimatePromptTokens(templateName, variables, complexity);
  
  if (totalTokens <= maxTokens) {
    return variables; // No optimization needed
  }
  
  const optimized = { ...variables };
  const reductionNeeded = totalTokens - maxTokens;
  
  // Reduce variable content proportionally
  Object.keys(optimized).forEach(key => {
    if (optimized[key] && key !== 'prompt') {
      const currentLength = optimized[key]!.length;
      const reductionRatio = Math.max(0.1, 1 - (reductionNeeded / currentLength) * 0.5);
      const newLength = Math.floor(currentLength * reductionRatio);
      
      if (newLength < currentLength) {
        optimized[key] = optimized[key]!.substring(0, newLength) + '...';
      }
    }
  });
  
  return optimized;
}