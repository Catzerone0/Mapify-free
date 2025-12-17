/**
 * Validation and utility helpers for mind-map data contract
 */

import { z } from 'zod';
import { MapNodeData, MindMapData, ValidationResult } from './types';

// Schema validation for MapNodeData (type annotation to fix circular reference)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MapNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  parentId: z.string().optional(),
  level: z.number().int().min(0, 'Level must be non-negative'),
  order: z.number().int().min(0, 'Order must be non-negative'),
  visual: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
    color: z.string().optional(),
    shape: z.enum(['rectangle', 'circle', 'diamond', 'hexagon']),
    isCollapsed: z.boolean(),
  }),
  citations: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string(),
      url: z.string().url().optional(),
      summary: z.string().optional(),
      author: z.string().optional(),
      createdAt: z.date().optional(),
    })
  ),
  children: z.array(MapNodeSchema).optional(),
}));

// Schema validation for MindMapData
export const MindMapSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  summary: z.string().optional(),
  prompt: z.string().optional(),
  provider: z.string().optional(),
  complexity: z.enum(['simple', 'moderate', 'complex']),
  rootNodes: z.array(MapNodeSchema),
  metadata: z.object({
    totalNodes: z.number().int().min(0),
    maxDepth: z.number().int().min(0),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
  }),
});

/**
 * Validate a MapNodeData structure
 */
export function validateMapNode(node: unknown): ValidationResult {
  const result: ValidationResult = {
    isValid: false,
    errors: [],
    warnings: [],
  };

  try {
    const validated = MapNodeSchema.parse(node);
    result.isValid = true;
    
    // Additional business logic validation
    if (validated.children) {
      const childValidation = validateMapNodeTree(validated.children);
      result.warnings.push(...childValidation.warnings);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      result.errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    } else {
      result.errors.push('Unknown validation error');
    }
  }

  return result;
}

/**
 * Validate a complete mind-map data structure
 */
export function validateMindMap(mindMap: unknown): ValidationResult {
  const result: ValidationResult = {
    isValid: false,
    errors: [],
    warnings: [],
  };

  try {
    const validated = MindMapSchema.parse(mindMap);
    result.isValid = true;
    
    // Validate tree structure
    if (validated.rootNodes.length > 0) {
      const rootValidation = validateMapNodeTree(validated.rootNodes);
      result.errors.push(...rootValidation.errors);
      result.warnings.push(...rootValidation.warnings);
    }
    
    // Validate metadata consistency
    const actualNodeCount = countNodes(validated.rootNodes);
    if (actualNodeCount !== validated.metadata.totalNodes) {
      result.warnings.push(
        `Node count mismatch: metadata says ${validated.metadata.totalNodes}, actual count is ${actualNodeCount}`
      );
    }
    
    const actualMaxDepth = getMaxDepth(validated.rootNodes);
    if (actualMaxDepth !== validated.metadata.maxDepth) {
      result.warnings.push(
        `Max depth mismatch: metadata says ${validated.metadata.maxDepth}, actual depth is ${actualMaxDepth}`
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      result.errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    } else {
      result.errors.push('Unknown validation error');
    }
  }

  return result;
}

/**
 * Validate a tree of MapNodeData structures
 */
function validateMapNodeTree(nodes: MapNodeData[]): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  const seenIds = new Set<string>();
  const ordersByLevel: Record<number, Set<number>> = {};

  for (const node of nodes) {
    // Validate node
    const nodeValidation = validateMapNode(node);
    if (!nodeValidation.isValid) {
      result.isValid = false;
      result.errors.push(...nodeValidation.errors);
    }
    result.warnings.push(...nodeValidation.warnings);

    // Validate ID uniqueness
    if (node.id && seenIds.has(node.id)) {
      result.errors.push(`Duplicate node ID: ${node.id}`);
    }
    seenIds.add(node.id || '');

    // Validate order uniqueness at same level
    if (!ordersByLevel[node.level]) {
      ordersByLevel[node.level] = new Set();
    }
    if (ordersByLevel[node.level].has(node.order)) {
      result.warnings.push(`Duplicate order at level ${node.level}: ${node.order}`);
    }
    ordersByLevel[node.level].add(node.order);

    // Validate parent-child relationships
    if (node.children) {
      const childValidation = validateMapNodeTree(node.children);
      result.isValid = result.isValid && childValidation.isValid;
      result.errors.push(...childValidation.errors);
      result.warnings.push(...childValidation.warnings);
    }
  }

  return result;
}

/**
 * Count total nodes in a tree
 */
export function countNodes(nodes: MapNodeData[]): number {
  let count = nodes.length;
  for (const node of nodes) {
    if (node.children) {
      count += countNodes(node.children);
    }
  }
  return count;
}

/**
 * Get maximum depth of the tree
 */
export function getMaxDepth(nodes: MapNodeData[]): number {
  let maxDepth = 0;
  for (const node of nodes) {
    const childDepth = node.children ? getMaxDepth(node.children) : 0;
    maxDepth = Math.max(maxDepth, node.level + childDepth);
  }
  return maxDepth;
}

/**
 * Find a node by ID in the tree
 */
export function findNodeById(nodes: MapNodeData[], id: string): MapNodeData | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Generate automatic positioning for nodes in a tree layout
 */
export function generateAutoLayout(nodes: MapNodeData[], startX = 0, startY = 0, levelHeight = 150, nodeWidth = 200): MapNodeData[] {
  return nodes.map((node, index) => {
    const updatedNode = { ...node };
    
    // Calculate position based on level and order
    updatedNode.visual.x = startX + (index * (nodeWidth + 50));
    updatedNode.visual.y = startY + (node.level * levelHeight);
    
    // Recursively layout children
    if (updatedNode.children) {
      updatedNode.children = generateAutoLayout(updatedNode.children, updatedNode.visual.x, updatedNode.visual.y, levelHeight, nodeWidth);
    }
    
    return updatedNode;
  });
}

/**
 * Flatten tree structure into array with parent-child relationships
 */
export function flattenNodes(nodes: MapNodeData[]): Array<MapNodeData & { parentId?: string }> {
  const result: Array<MapNodeData & { parentId?: string }> = [];
  
  for (const node of nodes) {
    const { children, ...nodeData } = node;
    result.push({ ...nodeData });
    
    if (children) {
      const flattenedChildren = flattenNodes(children);
      result.push(...flattenedChildren.map(child => ({ ...child, parentId: node.id })));
    }
  }
  
  return result;
}

/**
 * Build tree structure from flat array
 */
export function buildTreeFromFlat(flatNodes: Array<MapNodeData & { parentId?: string }>): MapNodeData[] {
  const nodeMap = new Map<string, MapNodeData>();
  const rootNodes: MapNodeData[] = [];
  
  // Create node map - only include nodes that have IDs
  flatNodes.forEach(node => {
    if (node.id) {
      nodeMap.set(node.id, { ...node, children: [] });
    }
  });
  
  // Build parent-child relationships
  flatNodes.forEach(node => {
    if (!node.id) return; // Skip nodes without IDs
    
    const currentNode = nodeMap.get(node.id)!;
    if (node.parentId) {
      const parentNode = nodeMap.get(node.parentId);
      if (parentNode) {
        parentNode.children = parentNode.children || [];
        parentNode.children.push(currentNode);
      }
    } else {
      rootNodes.push(currentNode);
    }
  });
  
  return rootNodes;
}

/**
 * Calculate similarity between two mind-map structures for diffing
 */
export function calculateDiff(oldMap: MindMapData, newMap: MindMapData): {
  added: MapNodeData[];
  removed: MapNodeData[];
  modified: Array<{ oldNode: MapNodeData; newNode: MapNodeData }>;
} {
  const oldFlat = flattenNodes(oldMap.rootNodes);
  const newFlat = flattenNodes(newMap.rootNodes);
  
  const oldMapById = new Map(oldFlat.map(n => [n.id!, n]));
  const newMapById = new Map(newFlat.map(n => [n.id!, n]));
  
  const added: MapNodeData[] = [];
  const removed: MapNodeData[] = [];
  const modified: Array<{ oldNode: MapNodeData; newNode: MapNodeData }> = [];
  
  // Find added and modified nodes
  for (const [id, newNode] of newMapById) {
    if (!oldMapById.has(id)) {
      added.push(newNode);
    } else {
      const oldNode = oldMapById.get(id)!;
      if (JSON.stringify(oldNode) !== JSON.stringify(newNode)) {
        modified.push({ oldNode, newNode });
      }
    }
  }
  
  // Find removed nodes
  for (const [id, oldNode] of oldMapById) {
    if (!newMapById.has(id)) {
      removed.push(oldNode);
    }
  }
  
  return { added, removed, modified };
}

/**
 * Serialize mind-map data to JSON with metadata
 */
export function serializeMindMap(mindMap: MindMapData): string {
  const serialized = {
    ...mindMap,
    metadata: {
      ...mindMap.metadata,
      createdAt: mindMap.metadata.createdAt?.toISOString(),
      updatedAt: mindMap.metadata.updatedAt?.toISOString(),
    },
  };
  
  return JSON.stringify(serialized, null, 2);
}

/**
 * Deserialize mind-map data from JSON with date parsing
 */
export function deserializeMindMap(json: string): MindMapData {
  const parsed = JSON.parse(json);
  
  // Parse dates
  if (parsed.metadata?.createdAt) {
    parsed.metadata.createdAt = new Date(parsed.metadata.createdAt);
  }
  if (parsed.metadata?.updatedAt) {
    parsed.metadata.updatedAt = new Date(parsed.metadata.updatedAt);
  }
  
  // Validate the structure
  const validation = validateMindMap(parsed);
  if (!validation.isValid) {
    throw new Error(`Invalid mind-map data: ${validation.errors.join(', ')}`);
  }
  
  return parsed;
}