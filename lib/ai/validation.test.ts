/**
 * Unit tests for mind map schema validation
 */

import { 
  validateMindMap, 
  validateMapNode, 
  countNodes, 
  getMaxDepth, 
  findNodeById,
  generateAutoLayout,
  flattenNodes,
  buildTreeFromFlat
} from '@/lib/ai/validation';
import { MapNodeData, MindMapData } from '@/lib/ai/types';

describe('Mind Map Validation', () => {
  describe('validateMapNode', () => {
    it('should validate a valid map node', () => {
      const validNode: MapNodeData = {
        title: 'Test Node',
        content: 'Test content',
        level: 0,
        order: 0,
        visual: {
          x: 0,
          y: 0,
          width: 200,
          height: 100,
          shape: 'rectangle',
          isCollapsed: false,
        },
        citations: [],
      };

      const result = validateMapNode(validNode);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject a node with invalid level', () => {
      const invalidNode = {
        title: 'Test Node',
        content: 'Test content',
        level: -1,
        order: 0,
        visual: {
          x: 0,
          y: 0,
          width: 200,
          height: 100,
          shape: 'rectangle',
          isCollapsed: false,
        },
        citations: [],
      };

      const result = validateMapNode(invalidNode);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate a node with children', () => {
      const nodeWithChildren: MapNodeData = {
        title: 'Parent Node',
        content: 'Parent content',
        level: 0,
        order: 0,
        visual: {
          x: 0,
          y: 0,
          width: 200,
          height: 100,
          shape: 'rectangle',
          isCollapsed: false,
        },
        citations: [],
        children: [
          {
            title: 'Child Node',
            content: 'Child content',
            level: 1,
            order: 0,
            visual: {
              x: 0,
              y: 150,
              width: 200,
              height: 100,
              shape: 'rectangle',
              isCollapsed: false,
            },
            citations: [],
          },
        ],
      };

      const result = validateMapNode(nodeWithChildren);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateMindMap', () => {
    it('should validate a complete mind map', () => {
      const validMindMap: MindMapData = {
        title: 'Test Mind Map',
        description: 'A test mind map',
        complexity: 'moderate',
        rootNodes: [
          {
            title: 'Root Node',
            content: 'Root content',
            level: 0,
            order: 0,
            visual: {
              x: 0,
              y: 0,
              width: 200,
              height: 100,
              shape: 'rectangle',
              isCollapsed: false,
            },
            citations: [],
          },
        ],
        metadata: {
          totalNodes: 1,
          maxDepth: 0,
        },
      };

      const result = validateMindMap(validMindMap);
      expect(result.isValid).toBe(true);
    });

    it('should reject a mind map with invalid complexity', () => {
      const invalidMindMap = {
        title: 'Test Mind Map',
        complexity: 'invalid-complexity',
        rootNodes: [],
        metadata: {
          totalNodes: 0,
          maxDepth: 0,
        },
      };

      const result = validateMindMap(invalidMindMap);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    const sampleNodes: MapNodeData[] = [
      {
        id: 'root-1',
        title: 'Root 1',
        content: 'Root 1 content',
        level: 0,
        order: 0,
        visual: { x: 0, y: 0, width: 200, height: 100, shape: 'rectangle', isCollapsed: false },
        citations: [],
        children: [
          {
            id: 'child-1',
            title: 'Child 1',
            content: 'Child 1 content',
            level: 1,
            order: 0,
            visual: { x: 0, y: 150, width: 200, height: 100, shape: 'rectangle', isCollapsed: false },
            citations: [],
          },
          {
            id: 'child-2',
            title: 'Child 2',
            content: 'Child 2 content',
            level: 1,
            order: 1,
            visual: { x: 250, y: 150, width: 200, height: 100, shape: 'rectangle', isCollapsed: false },
            citations: [],
          },
        ],
      },
      {
        id: 'root-2',
        title: 'Root 2',
        content: 'Root 2 content',
        level: 0,
        order: 1,
        visual: { x: 500, y: 0, width: 200, height: 100, shape: 'rectangle', isCollapsed: false },
        citations: [],
      },
    ];

    it('should count nodes correctly', () => {
      expect(countNodes(sampleNodes)).toBe(4); // 2 root + 2 children (Child 1, Child 2)
    });

    it('should calculate max depth correctly', () => {
      expect(getMaxDepth(sampleNodes)).toBe(1);
    });

    it('should find node by ID', () => {
      const nodesWithIds = sampleNodes.map((node, index) => ({
        ...node,
        id: `node-${index}`,
        children: node.children?.map((child, childIndex) => ({
          ...child,
          id: `node-${index}-${childIndex}`,
        })),
      }));

      const found = findNodeById(nodesWithIds, 'node-0-1');
      expect(found).toBeDefined();
      expect(found?.title).toBe('Child 2');
    });

    it('should generate auto layout', () => {
      const layoutNodes = generateAutoLayout(sampleNodes);
      
      expect(layoutNodes[0].visual.x).toBe(0);
      expect(layoutNodes[0].visual.y).toBe(0);
      expect(layoutNodes[1].visual.x).toBe(250);
      expect(layoutNodes[1].visual.y).toBe(0);
    });

    it('should flatten and rebuild tree correctly', () => {
      const flatNodes = flattenNodes(sampleNodes);
      expect(flatNodes).toHaveLength(4); // 2 root + 2 children (no ID, so we get 4 nodes)
      
      const rebuiltTree = buildTreeFromFlat(flatNodes);
      expect(rebuiltTree).toHaveLength(2); // 2 root nodes
      expect(rebuiltTree[0].children).toHaveLength(2); // Root 1 has 2 children
    });
  });
});