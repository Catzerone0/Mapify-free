'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node as RFNode,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  ReactFlowProvider,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './mindmap-editor.css';

import { useMindMapStore } from '@/lib/stores/mindmap';
import { MapNodeData } from '@/lib/ai/types';
import { MindMapNode } from './MindMapNode';
import { NodeControlPanel } from './NodeControlPanel';
import { ToolbarPanel } from './ToolbarPanel';
import { SourcePreviewPanel } from './SourcePreviewPanel';
import { CommandPalette } from './CommandPalette';

export interface MindMapEditorProps {
  mindMapId?: string;
  onClose?: () => void;
}

// Node types for React Flow
const nodeTypes = {
  mindmapNode: MindMapNode,
};

export function MindMapEditor({ mindMapId, onClose }: MindMapEditorProps) {
  const {
    mindMap,
    selectedNodes,
    editorSettings,
    streamingProgress,
    updateNode,
    addNode,
    deleteNode,
    selectNode,
    clearSelection,
    loadMindMap,
  } = useMindMapStore();

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSourcePanel, setShowSourcePanel] = useState(false);
  const [showControlPanel, setShowControlPanel] = useState(false);
  const [selectedNodeForPanel, setSelectedNodeForPanel] = useState<string | null>(null);

  // Load mind map on mount
  useEffect(() => {
    if (mindMapId) {
      loadMindMap(mindMapId);
    }
  }, [mindMapId, loadMindMap]);

  // Convert MapNodeData to React Flow nodes
  const convertToFlowNodes = useCallback((mapNodes: MapNodeData[]): any[] => {
    const flowNodes: any[] = [];

    const traverseNodes = (nodes: MapNodeData[], parentX = 0, parentY = 0) => {
      nodes.forEach((node) => {
        const isSelected = selectedNodes.includes(node.id || '');
        const isStreaming = streamingProgress?.nodeId === node.id;

        const flowNode: any = {
          id: node.id || '',
          type: 'mindmapNode',
          position: {
            x: node.visual.x,
            y: node.visual.y,
          },
          data: {
            ...node,
            isSelected,
            isStreaming,
            onEdit: (updates: Partial<MapNodeData>) => updateNode(node.id!, updates),
            onSelect: () => selectNode(node.id!),
            onDelete: () => deleteNode(node.id!),
            onAddChild: (childData?: Partial<MapNodeData>) => {
              const newNodeId = addNode(node.id!, childData || {});
              // Update the parent node to refresh children
              setTimeout(() => {
                const updatedNode = { ...node, children: [...(node.children || []), { ...childData, id: newNodeId } as MapNodeData] };
                updateNode(node.id!, { children: updatedNode.children });
              }, 100);
            },
          },
          style: {
            width: node.visual.width,
            height: node.visual.height,
          },
          draggable: !streamingProgress,
          selectable: !streamingProgress,
        };

        flowNodes.push(flowNode);

        if (node.children && node.children.length > 0) {
          traverseNodes(node.children, node.visual.x, node.visual.y);
        }
      });
    };

    traverseNodes(mapNodes);
    return flowNodes;
  }, [selectedNodes, streamingProgress, updateNode, addNode, deleteNode, selectNode]);

  // Convert to edges for connections
  const convertToFlowEdges = useCallback((mapNodes: MapNodeData[]): any[] => {
    const flowEdges: any[] = [];

    const traverseNodes = (nodes: MapNodeData[]) => {
      nodes.forEach((node) => {
        if (node.children) {
          node.children.forEach((child) => {
            flowEdges.push({
              id: `${node.id}-${child.id}`,
              source: node.id!,
              target: child.id!,
              type: 'smoothstep',
              animated: streamingProgress?.nodeId === child.id,
              style: {
                stroke: editorSettings.theme === 'dark' ? '#374151' : '#e5e7eb',
                strokeWidth: 2,
              },
            });
          });
          traverseNodes(node.children);
        }
      });
    };

    traverseNodes(mapNodes);
    return flowEdges;
  }, [streamingProgress, editorSettings.theme]);

  // Update React Flow when store changes
  useEffect(() => {
    if (!mindMap?.rootNodes) return;

    const flowNodes = convertToFlowNodes(mindMap.rootNodes);
    const flowEdges = convertToFlowEdges(mindMap.rootNodes);

    setRfNodes(flowNodes as any);
    setRfEdges(flowEdges as any);
  }, [mindMap, convertToFlowNodes, convertToFlowEdges, setRfNodes, setRfEdges]);

  // Handle node clicks
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: RFNode) => {
      event.preventDefault();
      event.stopPropagation();

      const isCtrlClick = event.ctrlKey || event.metaKey;
      selectNode(node.id, isCtrlClick);
      setSelectedNodeForPanel(node.id);
      setShowControlPanel(true);
    },
    [selectNode]
  );

  // Handle background clicks (deselect)
  const onPaneClick = useCallback(() => {
    clearSelection();
    setSelectedNodeForPanel(null);
    setShowControlPanel(false);
  }, [clearSelection]);

  // Handle connections
  const onConnect = useCallback(
    (params: Connection) => {
      // Handle node connection logic here
      console.log('Connection attempted:', params);
      // setEdges((eds) => addEdge(params, eds));
    },
    []
  );

  // Handle drag and drop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      if (position) {
        const newNodeData: Partial<MapNodeData> = {
          title: 'New Node',
          content: '',
          visual: {
            x: position.x,
            y: position.y,
            width: 120,
            height: 80,
            shape: 'rectangle',
            isCollapsed: false,
          },
        };

        addNode(null, newNodeData);
      }
    },
    [reactFlowInstance, addNode]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setShowCommandPalette(true);
      }

      if (event.key === 'Escape') {
        setShowCommandPalette(false);
        setShowControlPanel(false);
        setShowSourcePanel(false);
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        // Save changes
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodes.length > 0) {
          selectedNodes.forEach(nodeId => deleteNode(nodeId));
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, deleteNode]);

  if (!mindMap) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading mind map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <ReactFlowProvider>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange as any}
          onEdgesChange={onEdgesChange as any}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          onInit={setReactFlowInstance}
          className={editorSettings.theme === 'dark' ? 'dark' : ''}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          fitView
          fitViewOptions={{
            padding: 0.1,
            includeHiddenNodes: false,
          }}
          panOnScroll
          selectionOnDrag
          multiSelectionKeyCode={['Control', 'Meta']}
        >
          <Background color={editorSettings.theme === 'dark' ? '#374151' : '#e5e7eb'} gap={20} />
          <Controls className={editorSettings.theme === 'dark' ? 'dark-controls' : ''} />
          <MiniMap 
            className={editorSettings.theme === 'dark' ? 'dark-minimap' : ''}
            nodeColor={(node) => {
              switch (node.type) {
                case 'mindmapNode':
                  return '#3b82f6';
                default:
                  return '#6b7280';
              }
            }}
          />
          
          {/* Toolbar Panel */}
          <Panel position="top-left">
            <ToolbarPanel
              onToggleSourcePanel={() => setShowSourcePanel(!showSourcePanel)}
              onToggleControlPanel={() => setShowControlPanel(!showControlPanel)}
              onShowCommandPalette={() => setShowCommandPalette(true)}
            />
          </Panel>

          {/* Streaming Progress */}
          {streamingProgress && (
            <Panel position="top-center">
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm font-medium">
                    {streamingProgress.status === 'generating' && 'Generating content...'}
                    {streamingProgress.status === 'streaming' && 'Streaming results...'}
                    {streamingProgress.status === 'complete' && 'Generation complete!'}
                    {streamingProgress.status === 'error' && 'Generation failed'}
                  </span>
                </div>
              </div>
            </Panel>
          )}

          {/* Layout */}
          <div className={`absolute inset-0 ${editorSettings.theme === 'dark' ? 'dark' : ''}`}>
            <style jsx>{`
              .react-flow__node {
                background: transparent;
                border: none;
              }
              .react-flow__node.selected {
                box-shadow: 0 0 0 2px #3b82f6;
              }
              .dark .react-flow__node.selected {
                box-shadow: 0 0 0 2px #60a5fa;
              }
              .react-flow__edge {
                stroke: ${editorSettings.theme === 'dark' ? '#374151' : '#e5e7eb'};
              }
              .react-flow__edge.animated {
                stroke-dasharray: 5;
                animation: dashdraw 0.5s linear infinite;
              }
              @keyframes dashdraw {
                to {
                  stroke-dashoffset: -10;
                }
              }
            `}</style>
          </div>
        </ReactFlow>
      </ReactFlowProvider>

      {/* Control Panel */}
      {showControlPanel && selectedNodeForPanel && (
        <NodeControlPanel
          nodeId={selectedNodeForPanel}
          onClose={() => setShowControlPanel(false)}
        />
      )}

      {/* Source Preview Panel */}
      {showSourcePanel && mindMap.summary && (
        <SourcePreviewPanel
          summary={mindMap.summary}
          sources={[]}
          onClose={() => setShowSourcePanel(false)}
        />
      )}

      {/* Command Palette */}
      {showCommandPalette && (
        <CommandPalette
          onClose={() => setShowCommandPalette(false)}
        />
      )}
    </div>
  );
}

// Wrapper component to ensure proper React Flow context
export function MindMapEditorContainer(props: MindMapEditorProps) {
  return (
    <ReactFlowProvider>
      <MindMapEditor {...props} />
    </ReactFlowProvider>
  );
}