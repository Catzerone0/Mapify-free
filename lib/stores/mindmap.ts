import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  MapNodeData, 
  MindMapData, 
  ComplexityLevel
} from '@/lib/ai/types';
import { v4 as uuidv4 } from 'uuid';

function getAuthHeader() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface StreamProgress {
  nodeId?: string;
  status: 'pending' | 'generating' | 'streaming' | 'complete' | 'error';
  message?: string;
  progress?: number;
}

export interface NodeSelection {
  nodeId: string;
  multiSelect?: boolean;
}

export interface LayoutSettings {
  type: 'hierarchical' | 'radial' | 'force';
  direction: 'TB' | 'LR' | 'RL' | 'BT';
  spacing: [number, number];
}

export interface EditorSettings {
  theme: 'light' | 'dark';
  complexity: ComplexityLevel;
  autoLayout: boolean;
  showCitations: boolean;
  showMetadata: boolean;
  layout: LayoutSettings;
}

export interface ChangeHistory {
  id: string;
  timestamp: Date;
  description: string;
  changes: Array<{
    type: 'create' | 'update' | 'delete';
    nodeId: string;
    oldValue?: unknown;
    newValue?: unknown;
  }>;
}

export interface MindMapStore {
  // Core data
  mindMap: MindMapData | null;
  isLoading: boolean;
  error: string | null;
  
  // UI state
  selectedNodes: string[];
  editorSettings: EditorSettings;
  streamingProgress: StreamProgress | null;
  
  // History
  history: ChangeHistory[];
  historyIndex: number;
  
  // Actions
  setMindMap: (mindMap: MindMapData) => void;
  updateNode: (nodeId: string, updates: Partial<MapNodeData>) => void;
  addNode: (parentId: string | null, nodeData: Partial<MapNodeData>) => string;
  deleteNode: (nodeId: string) => void;
  moveNode: (nodeId: string, newParentId: string | null, newIndex: number) => void;
  
  // Selection
  selectNode: (nodeId: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  getSelectedNodes: () => MapNodeData[];
  
  // Layout
  applyLayout: (type: LayoutSettings['type']) => void;
  autoLayout: () => void;
  
  // Settings
  updateSettings: (settings: Partial<EditorSettings>) => void;
  
  // Generation
  expandNode: (nodeId: string, prompt?: string, complexity?: ComplexityLevel) => Promise<void>;
  regenerateBranch: (nodeId: string) => Promise<void>;
  summarizeNode: (nodeId: string) => Promise<void>;
  
  // Streaming
  setStreamingProgress: (progress: StreamProgress | null) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  addToHistory: (description: string, changes: ChangeHistory['changes']) => void;
  
  // Persistence
  saveChanges: () => Promise<void>;
  loadMindMap: (id: string) => Promise<void>;
}

export const useMindMapStore = create<MindMapStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    mindMap: null,
    isLoading: false,
    error: null,
    
    selectedNodes: [],
    
    editorSettings: {
      theme: 'light',
      complexity: 'moderate',
      autoLayout: true,
      showCitations: true,
      showMetadata: true,
      layout: {
        type: 'hierarchical',
        direction: 'TB',
        spacing: [150, 100],
      },
    },
    
    streamingProgress: null,
    
    history: [],
    historyIndex: -1,

    // Core data actions
    setMindMap: (mindMap) => set({ mindMap }),

    updateNode: (nodeId, updates) => {
      const state = get();
      if (!state.mindMap) return;

      const updateNodeInTree = (nodes: MapNodeData[]): MapNodeData[] => {
        return nodes.map((node) => {
          if (node.id === nodeId) {
            return { ...node, ...updates };
          }
          if (node.children) {
            return { ...node, children: updateNodeInTree(node.children) };
          }
          return node;
        });
      };

      const updatedMindMap = {
        ...state.mindMap,
        rootNodes: updateNodeInTree(state.mindMap.rootNodes),
        metadata: {
          ...state.mindMap.metadata,
          updatedAt: new Date(),
        },
      };

      set({ mindMap: updatedMindMap });
    },

    addNode: (parentId, nodeData) => {
      const state = get();
      if (!state.mindMap) return '';

      const newNodeId = uuidv4();
      const newNode: MapNodeData = {
        id: newNodeId,
        title: nodeData.title || 'New Node',
        content: nodeData.content || '',
        parentId: parentId || undefined,
        level: nodeData.level || 1,
        order: nodeData.order || 0,
        visual: {
          x: nodeData.visual?.x || 0,
          y: nodeData.visual?.y || 0,
          width: nodeData.visual?.width || 120,
          height: nodeData.visual?.height || 80,
          color: nodeData.visual?.color,
          shape: nodeData.visual?.shape || 'rectangle',
          isCollapsed: false,
        },
        citations: nodeData.citations || [],
        children: [],
      };

      const addNodeToTree = (nodes: MapNodeData[]): MapNodeData[] => {
        if (!parentId) {
          return [...nodes, newNode];
        }

        return nodes.map((node) => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...(node.children || []), newNode],
            };
          }
          if (node.children) {
            return { ...node, children: addNodeToTree(node.children) };
          }
          return node;
        });
      };

      const updatedMindMap = {
        ...state.mindMap,
        rootNodes: addNodeToTree(state.mindMap.rootNodes),
        metadata: {
          ...state.mindMap.metadata,
          totalNodes: state.mindMap.metadata.totalNodes + 1,
          updatedAt: new Date(),
        },
      };

      set({ mindMap: updatedMindMap });
      return newNodeId;
    },

    deleteNode: (nodeId) => {
      const state = get();
      if (!state.mindMap) return;

      const deleteNodeFromTree = (nodes: MapNodeData[]): MapNodeData[] => {
        return nodes.filter((node) => {
          if (node.id === nodeId) return false;
          if (node.children) {
            node.children = deleteNodeFromTree(node.children);
          }
          return true;
        });
      };

      const updatedMindMap = {
        ...state.mindMap,
        rootNodes: deleteNodeFromTree(state.mindMap.rootNodes),
        metadata: {
          ...state.mindMap.metadata,
          totalNodes: Math.max(0, state.mindMap.metadata.totalNodes - 1),
          updatedAt: new Date(),
        },
      };

      set({ 
        mindMap: updatedMindMap,
        selectedNodes: state.selectedNodes.filter(id => id !== nodeId),
      });
    },

    moveNode: (nodeId, newParentId, newIndex) => {
      const state = get();
      if (!state.mindMap) return;

      // Get the node to move
      const nodeToMove: MapNodeData | null = null;

      // Remove from current position
      const removeNode = (nodes: MapNodeData[]): MapNodeData[] => {
        return nodes.filter((node) => {
          if (node.id === nodeId) {
            return false;
          }
          if (node.children) {
            node.children = removeNode(node.children);
          }
          return true;
        });
      };

      // Add to new position
      const addNodeToParent = (nodes: MapNodeData[]): MapNodeData[] => {
        return nodes.map((node) => {
          if (node.id === newParentId) {
            const children = node.children || [];
            const newChildren = [...children];
            newChildren.splice(newIndex, 0, {
              ...nodeToMove!,
              parentId: newParentId,
            });
            return { ...node, children: newChildren };
          }
          if (node.children) {
            return { ...node, children: addNodeToParent(node.children) };
          }
          return node;
        });
      };

      let updatedNodes = removeNode(state.mindMap.rootNodes);
      
      if (newParentId) {
        updatedNodes = addNodeToParent(updatedNodes);
      } else {
        // Add to root
        const newNodes = [...updatedNodes];
        newNodes.splice(newIndex, 0, {
          ...nodeToMove!,
          parentId: undefined,
        });
        updatedNodes = newNodes;
      }

      const updatedMindMap = {
        ...state.mindMap,
        rootNodes: updatedNodes,
        metadata: {
          ...state.mindMap.metadata,
          updatedAt: new Date(),
        },
      };

      set({ mindMap: updatedMindMap });
    },

    // Selection actions
    selectNode: (nodeId, multiSelect = false) => {
      const state = get();
      
      if (multiSelect) {
        const isSelected = state.selectedNodes.includes(nodeId);
        const newSelectedNodes = isSelected
          ? state.selectedNodes.filter(id => id !== nodeId)
          : [...state.selectedNodes, nodeId];
        set({ selectedNodes: newSelectedNodes });
      } else {
        set({ selectedNodes: [nodeId] });
      }
    },

    clearSelection: () => set({ selectedNodes: [] }),

    getSelectedNodes: () => {
      const state = get();
      if (!state.mindMap) return [];

      const findNode = (nodes: MapNodeData[]): MapNodeData[] => {
        return nodes.flatMap((node) => {
          if (node.id && state.selectedNodes.includes(node.id)) {
            return [node];
          }
          if (node.children) {
            return findNode(node.children);
          }
          return [];
        });
      };

      return findNode(state.mindMap.rootNodes);
    },

    // Layout actions
    applyLayout: (type) => {
      const state = get();
      if (!state.mindMap) return;

      const newSettings = {
        ...state.editorSettings,
        layout: {
          ...state.editorSettings.layout,
          type,
        },
      };

      set({ editorSettings: newSettings });
    },

    autoLayout: () => {
      const state = get();
      if (!state.mindMap) return;

      // Simple auto-layout implementation
      const applyAutoLayout = (nodes: MapNodeData[], level = 0): MapNodeData[] => {
        return nodes.map((node, i) => {
          const spacing = state.editorSettings.layout.spacing;
          
          const updatedNode = {
            ...node,
            level,
            order: i,
            visual: {
              ...node.visual,
              x: i * spacing[0],
              y: level * spacing[1],
            },
          };

          if (node.children && node.children.length > 0) {
            return {
              ...updatedNode,
              children: applyAutoLayout(node.children, level + 1),
            };
          }

          return updatedNode;
        });
      };

      const updatedMindMap = {
        ...state.mindMap,
        rootNodes: applyAutoLayout(state.mindMap.rootNodes),
      };

      set({ mindMap: updatedMindMap });
    },

    // Settings
    updateSettings: (settings) => {
      const state = get();
      set({
        editorSettings: {
          ...state.editorSettings,
          ...settings,
        },
      });
    },

    // Generation actions
    expandNode: async (nodeId, prompt, complexity) => {
      const state = get();
      if (!state.mindMap?.id) return;

      set({ streamingProgress: { nodeId, status: 'generating' } });

      try {
        const response = await fetch(`/api/maps/${state.mindMap.id}/expand-node`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({
            nodeId,
            prompt,
            complexity: complexity || state.editorSettings.complexity,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error);
        }

        // Update the mind map with the expanded node
        const updateNodeWithExpansion = (nodes: MapNodeData[]): MapNodeData[] => {
          return nodes.map((node) => {
            if (node.id === nodeId && result.data) {
              return { ...node, ...result.data };
            }
            if (node.children) {
              return { ...node, children: updateNodeWithExpansion(node.children) };
            }
            return node;
          });
        };

        const updatedMindMap = {
          ...state.mindMap,
          rootNodes: updateNodeWithExpansion(state.mindMap.rootNodes),
          metadata: {
            ...state.mindMap.metadata,
            totalNodes: state.mindMap.metadata.totalNodes + (result.data?.children?.length || 0),
            updatedAt: new Date(),
          },
        };

        set({ 
          mindMap: updatedMindMap,
          streamingProgress: { nodeId, status: 'complete' },
        });

      } catch (error) {
        console.error('Expansion failed:', error);
        set({ 
          streamingProgress: { nodeId, status: 'error', message: error instanceof Error ? error.message : 'Expansion failed' },
        });
      }
    },

    regenerateBranch: async (nodeId) => {
      const state = get();
      if (!state.mindMap?.id) return;

      set({ streamingProgress: { nodeId, status: 'generating' } });

      try {
        const response = await fetch(`/api/maps/${state.mindMap.id}/regenerate-node`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({
            nodeId,
            complexity: state.editorSettings.complexity,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error);
        }

        // Update the mind map with regenerated node
        const updateNodeWithRegeneration = (nodes: MapNodeData[]): MapNodeData[] => {
          return nodes.map((node) => {
            if (node.id === nodeId && result.data) {
              return { ...node, ...result.data };
            }
            if (node.children) {
              return { ...node, children: updateNodeWithRegeneration(node.children) };
            }
            return node;
          });
        };

        const updatedMindMap = {
          ...state.mindMap,
          rootNodes: updateNodeWithRegeneration(state.mindMap.rootNodes),
        };

        set({ 
          mindMap: updatedMindMap,
          streamingProgress: { nodeId, status: 'complete' },
        });

      } catch (error) {
        console.error('Regeneration failed:', error);
        set({ 
          streamingProgress: { nodeId, status: 'error', message: error instanceof Error ? error.message : 'Regeneration failed' },
        });
      }
    },

    summarizeNode: async (mindMapId) => {
      const state = get();
      if (!state.mindMap?.id) return;

      set({ streamingProgress: { nodeId: mindMapId, status: 'generating' } });

      try {
        const response = await fetch(`/api/maps/${state.mindMap.id}/summarize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({
            mindMapId: state.mindMap.id,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error);
        }

        // Update mind map with new summary
        const updatedMindMap = {
          ...state.mindMap,
          summary: result.summary,
          metadata: {
            ...state.mindMap.metadata,
            updatedAt: new Date(),
          },
        };

        set({ 
          mindMap: updatedMindMap,
          streamingProgress: { nodeId: mindMapId, status: 'complete' },
        });

      } catch (error) {
        console.error('Summarization failed:', error);
        set({ 
          streamingProgress: { nodeId: mindMapId, status: 'error', message: error instanceof Error ? error.message : 'Summarization failed' },
        });
      }
    },

    // Streaming
    setStreamingProgress: (progress) => set({ streamingProgress: progress }),

    // History
    addToHistory: (description, changes) => {
      const state = get();
      const newHistoryEntry: ChangeHistory = {
        id: uuidv4(),
        timestamp: new Date(),
        description,
        changes,
      };

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newHistoryEntry);

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },

    undo: () => {
      const state = get();
      if (state.historyIndex >= 0) {
        // Implement undo logic here
        set({ historyIndex: state.historyIndex - 1 });
      }
    },

    redo: () => {
      const state = get();
      if (state.historyIndex < state.history.length - 1) {
        // Implement redo logic here
        set({ historyIndex: state.historyIndex + 1 });
      }
    },

    // Persistence
    saveChanges: async () => {
      const state = get();
      if (!state.mindMap) return;

      set({ isLoading: true, error: null });

      try {
        const response = await fetch(`/api/maps/${state.mindMap.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({
            mindMap: state.mindMap,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save changes');
        }

      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Save failed' });
      } finally {
        set({ isLoading: false });
      }
    },

    loadMindMap: async (id) => {
      set({ isLoading: true, error: null });

      try {
        const response = await fetch(`/api/maps/${id}`, {
          headers: {
            ...getAuthHeader(),
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load mind map');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error);
        }

        set({ 
          mindMap: result.data,
          isLoading: false,
        });

      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Load failed',
          isLoading: false,
        });
      }
    },
  }))
);