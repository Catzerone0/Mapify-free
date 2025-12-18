'use client';

import React, { useEffect, useState } from 'react';
import { useMindMapStore } from '@/lib/stores/mindmap';
import { Citation, MapNodeData } from '@/lib/ai/types';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import {
  Circle,
  Diamond,
  ExternalLink,
  Hash,
  Hexagon,
  Plus,
  RotateCcw,
  Square,
  Trash2,
  Users,
  X,
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
  { label: 'Blue', value: '#0084FF' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Yellow', value: '#d97706' },
  { label: 'Pink', value: '#db2777' },
  { label: 'Gray', value: '#9A9591' },
  { label: 'Orange', value: '#ea580c' },
];

export function NodeControlPanel({ nodeId, onClose }: NodeControlPanelProps) {
  const { mindMap, updateNode, deleteNode, expandNode, regenerateBranch, editorSettings } =
    useMindMapStore();

  const [node, setNode] = useState<MapNodeData | null>(null);
  const [isEditingCitation, setIsEditingCitation] = useState(false);
  const [newCitation, setNewCitation] = useState({ title: '', url: '', summary: '' });

  useEffect(() => {
    if (!mindMap) return;

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
    setTimeout(() => setNode(foundNode), 0);
  }, [mindMap, nodeId]);

  const handleUpdateNode = (updates: Partial<MapNodeData>) => {
    updateNode(nodeId, updates);
    setNode((prev) => (prev ? { ...prev, ...updates } : null));
  };

  if (!node) {
    return (
      <div className="fixed right-4 top-20 w-80 h-32 rounded-md shadow-elevation-2 border border-border bg-popover text-popover-foreground p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Node Control</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-foreground-secondary">Loading...</p>
      </div>
    );
  }

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
    const updatedCitations = node.citations.filter((c) => c.id !== citationId);
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
    <div className="fixed right-4 top-20 w-80 max-h-[80vh] rounded-md shadow-elevation-2 border border-border bg-popover text-popover-foreground p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Node Control</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
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
            className="w-full p-2 text-sm border border-border rounded-md bg-input text-foreground placeholder:text-foreground-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            rows={3}
            placeholder="Node content"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Style</label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {shapeOptions.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => handleShapeChange(value)}
                className={[
                  'p-2 rounded-md border transition-colors',
                  node.visual.shape === value
                    ? 'border-primary'
                    : 'border-border hover:bg-accent',
                ].join(' ')}
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
                  className={[
                    'w-8 h-8 rounded-md border border-border',
                    node.visual.color === value ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '',
                  ].join(' ')}
                  style={{ backgroundColor: value }}
                  title={label}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Dimensions</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-small text-foreground-secondary mb-1">
                Width
              </label>
              <Input
                type="number"
                value={node.visual.width}
                onChange={(e) =>
                  handleDimensionChange('width', parseInt(e.target.value) || 120)
                }
                min="80"
                max="400"
              />
            </div>
            <div>
              <label className="block text-small text-foreground-secondary mb-1">
                Height
              </label>
              <Input
                type="number"
                value={node.visual.height}
                onChange={(e) =>
                  handleDimensionChange('height', parseInt(e.target.value) || 80)
                }
                min="60"
                max="300"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Metadata</label>
          <div className="p-3 rounded-md border border-border bg-secondary">
            <div className="flex items-center gap-4 text-small text-foreground-secondary">
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

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">
              Citations ({node.citations.length})
            </label>
            <Button onClick={() => setIsEditingCitation(true)} size="sm" variant="outline">
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {isEditingCitation && (
            <div className="p-3 rounded-md border border-border mb-2">
              <div className="space-y-2">
                <Input
                  value={newCitation.title}
                  onChange={(e) =>
                    setNewCitation((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Source title"
                />
                <Input
                  value={newCitation.url}
                  onChange={(e) =>
                    setNewCitation((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="URL (optional)"
                />
                <textarea
                  value={newCitation.summary}
                  onChange={(e) =>
                    setNewCitation((prev) => ({ ...prev, summary: e.target.value }))
                  }
                  className="w-full p-2 text-sm border border-border rounded-md bg-input text-foreground placeholder:text-foreground-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                  rows={2}
                  placeholder="Summary"
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddCitation} size="sm">
                    Add
                  </Button>
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
              <div
                key={citation.id}
                className="p-2 rounded-md border border-border bg-secondary"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{citation.title}</p>
                    {citation.url && (
                      <a
                        href={citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-small text-primary hover:text-primary-dark flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{citation.url}</span>
                      </a>
                    )}
                    {citation.summary && (
                      <p className="text-small text-foreground-secondary mt-1">
                        {citation.summary}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveCitation(citation.id!)}
                    className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                    title="Remove citation"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-4">
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

        <div className="border-t border-border pt-4">
          <label className="block text-sm font-medium mb-2 text-destructive">
            Danger Zone
          </label>
          <Button
            onClick={handleDeleteNode}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 text-destructive hover:bg-destructive/10 hover:border-destructive/40"
          >
            <Trash2 className="h-3 w-3" />
            Delete Node
          </Button>
        </div>
      </div>
    </div>
  );
}
