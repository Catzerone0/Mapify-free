'use client';

import React, { useState, useEffect } from 'react';
import { useMindMapStore } from '@/lib/stores/mindmap';
import { MapNodeData, Citation } from '@/lib/ai/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { 
  X, 
  Square, 
  Circle, 
  Diamond, 
  Hexagon,
  Plus,
  Trash2,
  ExternalLink,
  Hash,
  Users,
  RotateCcw
} from 'lucide-react';

export interface NodeControlPanelProps {
  nodeId: string;
  onClose: () => void;
}

const shapeOptions = [
  { value: 'rectangle' as const, icon: Square, label: 'Rectangle' },
  { value: 'circle' as const, icon: Circle, label: 'Circle' },
  { value: 'diamond' as const, icon: Diamond, label: 'Diamond' },
  { value: 'hexagon' as const, icon: Hexagon, label: 'Hexagon' },
];

const colorPresets = [
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#10b981' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Yellow', value: '#f59e0b' },
  { label: 'Pink', value: '#ec4899' },
  { label: 'Gray', value: '#6b7280' },
  { label: 'Orange', value: '#f97316' },
];

export function NodeControlPanel({ nodeId, onClose }: NodeControlPanelProps) {
  const {
    mindMap,
    updateNode,
    deleteNode,
    expandNode,
    regenerateBranch,
    editorSettings,
  } = useMindMapStore();

  const [node, setNode] = useState<MapNodeData | null>(null);
  const [isEditingCitation, setIsEditingCitation] = useState(false);
  const [newCitation, setNewCitation] = useState({ title: '', url: '', summary: '' });

  // Find the node data
  useEffect(() => {
    if (!mindMap) {
      return;
    }

    const findNode = (nodes: MapNodeData[]): MapNodeData | null => {
      for (const n of nodes) {
        if (n.id === nodeId) return n;
        if (n.children) {
          const found = findNode(n.children);
          if (found) return found;
        }
      }
      return null;
    };

    const foundNode = findNode(mindMap.rootNodes);
    
    // Use setTimeout to avoid calling setState in effect
    setTimeout(() => setNode(foundNode), 0);
  }, [mindMap, nodeId]);

  if (!node) {
    return (
      <div className={`fixed right-4 top-20 w-80 h-32 rounded-lg shadow-lg border p-4 ${
        editorSettings.theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Node Control</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-opacity-20">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  const handleUpdateNode = (updates: Partial<MapNodeData>) => {
    updateNode(nodeId, updates);
    setNode(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleUpdateVisual = (visualUpdates: Partial<MapNodeData['visual']>) => {
    handleUpdateNode({
      visual: {
        ...node.visual,
        ...visualUpdates,
      },
    });
  };

  const handleShapeChange = (shape: MapNodeData['visual']['shape']) => {
    handleUpdateVisual({ shape });
  };

  const handleColorChange = (color: string) => {
    handleUpdateVisual({ color });
  };

  const handleDimensionChange = (dimension: 'width' | 'height', value: number) => {
    handleUpdateVisual({ [dimension]: Math.max(80, value) });
  };

  const handleAddCitation = () => {
    if (!newCitation.title.trim()) return;

    const citation: Citation = {
      id: `citation-${Date.now()}`,
      title: newCitation.title,
      url: newCitation.url,
      summary: newCitation.summary,
    };

    const updatedCitations = [...node.citations, citation];
    handleUpdateNode({ citations: updatedCitations });
    setNewCitation({ title: '', url: '', summary: '' });
    setIsEditingCitation(false);
  };

  const handleRemoveCitation = (citationId: string) => {
    const updatedCitations = node.citations.filter(c => c.id !== citationId);
    handleUpdateNode({ citations: updatedCitations });
  };

  const handleExpandNode = () => {
    expandNode(nodeId, undefined, editorSettings.complexity);
  };

  const handleRegenerateNode = () => {
    regenerateBranch(nodeId);
  };

  const handleDeleteNode = () => {
    deleteNode(nodeId);
    onClose();
  };

  return (
    <div className={`fixed right-4 top-20 w-80 max-h-[80vh] rounded-lg shadow-lg border p-4 overflow-y-auto ${
      editorSettings.theme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Node Control</h3>
        <button 
          onClick={onClose} 
          className={`p-1 rounded hover:bg-opacity-20 ${
            editorSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Node Info */}
      <div className="space-y-4">
        {/* Title and Content */}
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <Input
            value={node.title || ''}
            onChange={(e) => handleUpdateNode({ title: e.target.value })}
            placeholder="Node title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Content</label>
          <textarea
            value={node.content}
            onChange={(e) => handleUpdateNode({ content: e.target.value })}
            className={`w-full p-2 text-sm border rounded ${
              editorSettings.theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-gray-100'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            rows={3}
            placeholder="Node content"
          />
        </div>

        {/* Shape and Color */}
        <div>
          <label className="block text-sm font-medium mb-2">Style</label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {shapeOptions.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => handleShapeChange(value)}
                className={`p-2 rounded border-2 ${
                  node.visual.shape === value
                    ? 'border-blue-500'
                    : editorSettings.theme === 'dark'
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                title={label}
              >
                <Icon className="h-4 w-4 mx-auto" />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="grid grid-cols-4 gap-2">
              {colorPresets.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleColorChange(value)}
                  className={`w-8 h-8 rounded border-2 ${
                    node.visual.color === value
                      ? 'border-gray-900 dark:border-gray-100'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: value }}
                  title={label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium mb-2">Dimensions</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Width</label>
              <Input
                type="number"
                value={node.visual.width}
                onChange={(e) => handleDimensionChange('width', parseInt(e.target.value) || 120)}
                min="80"
                max="400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Height</label>
              <Input
                type="number"
                value={node.visual.height}
                onChange={(e) => handleDimensionChange('height', parseInt(e.target.value) || 80)}
                min="60"
                max="300"
              />
            </div>
          </div>
        </div>

        {/* Node Metadata */}
        <div>
          <label className="block text-sm font-medium mb-2">Metadata</label>
          <div className={`p-3 rounded border ${
            editorSettings.theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                <span>Level {node.level}</span>
              </div>
              {node.children && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{node.children.length} children</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Citations */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Citations ({node.citations.length})</label>
            <Button
              onClick={() => setIsEditingCitation(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {isEditingCitation && (
            <div className={`p-3 rounded border mb-2 ${
              editorSettings.theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
            }`}>
              <div className="space-y-2">
                <Input
                  value={newCitation.title}
                  onChange={(e) => setNewCitation(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Source title"
                />
                <Input
                  value={newCitation.url}
                  onChange={(e) => setNewCitation(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="URL (optional)"
                />
                <textarea
                  value={newCitation.summary}
                  onChange={(e) => setNewCitation(prev => ({ ...prev, summary: e.target.value }))}
                  className={`w-full p-2 text-sm border rounded ${
                    editorSettings.theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-gray-100'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows={2}
                  placeholder="Summary"
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddCitation} size="sm">Add</Button>
                  <Button 
                    onClick={() => setIsEditingCitation(false)} 
                    size="sm" 
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {node.citations.map((citation) => (
              <div key={citation.id} className={`p-2 rounded border ${
                editorSettings.theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{citation.title}</p>
                    {citation.url && (
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {citation.url}
                      </a>
                    )}
                    {citation.summary && (
                      <p className="text-xs text-gray-500 mt-1">{citation.summary}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveCitation(citation.id!)}
                    className="p-1 rounded hover:bg-red-500 hover:text-white ml-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Actions */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-2">AI Actions</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleExpandNode}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-3 w-3" />
              Expand
            </Button>

            <Button
              onClick={handleRegenerateNode}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-3 w-3" />
              Regenerate
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-2 text-red-600">Danger Zone</label>
          <Button
            onClick={handleDeleteNode}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="h-3 w-3" />
            Delete Node
          </Button>
        </div>
      </div>
    </div>
  );
}