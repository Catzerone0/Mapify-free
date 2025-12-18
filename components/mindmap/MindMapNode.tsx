'use client';

import React, { useCallback, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MapNodeData } from '@/lib/ai/types';
import { useMindMapStore } from '@/lib/stores/mindmap';
import {
  ChevronDown,
  ChevronRight,
  Edit3,
  ExternalLink,
  Hash,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';

export interface MindMapNodeProps {
  data: MapNodeData & {
    isSelected?: boolean;
    isStreaming?: boolean;
    onEdit?: (updates: Partial<MapNodeData>) => void;
    onSelect?: () => void;
    onDelete?: () => void;
    onAddChild?: (childData?: Partial<MapNodeData>) => void;
  };
  selected?: boolean;
}

const HEX_CLIP_PATH =
  'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';

export function MindMapNode({ data, selected }: MindMapNodeProps) {
  const { editorSettings } = useMindMapStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.title || data.content);

  const isSelected = Boolean(selected || data.isSelected);
  const hasChildren = Boolean(data.children && data.children.length > 0);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(data.title || data.content);
    },
    [data.title, data.content]
  );

  const handleSaveEdit = useCallback(() => {
    if (data.onEdit) {
      const updates: Partial<MapNodeData> = {
        title: editValue.split('\n')[0],
        content: editValue,
      };
      data.onEdit(updates);
    }
    setIsEditing(false);
  }, [editValue, data]);

  const handleCancelEdit = useCallback(() => {
    setEditValue(data.title || data.content);
    setIsEditing(false);
  }, [data.title, data.content]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  const handleAddChild = useCallback(() => {
    data.onAddChild?.();
  }, [data]);

  const handleToggleCollapse = useCallback(() => {
    data.onEdit?.({
      visual: {
        ...data.visual,
        isCollapsed: !data.visual.isCollapsed,
      },
    });
  }, [data]);

  const handleNodeClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      data.onSelect?.();
    },
    [data]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      data.onDelete?.();
    },
    [data]
  );

  const renderCitations = () => {
    if (!data.citations || data.citations.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {data.citations.slice(0, 2).map((citation, index) => (
          <div
            key={citation.id || index}
            className="flex items-center gap-1 text-small text-foreground-secondary"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{citation.title}</span>
          </div>
        ))}
        {data.citations.length > 2 && (
          <div className="text-small text-foreground-secondary opacity-70">
            +{data.citations.length - 2} more
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-2">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-2 text-sm resize-none border border-border rounded-md bg-input text-foreground placeholder:text-foreground-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="h-8 px-3 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="h-8 px-3 text-sm rounded-md border border-border bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-sm text-foreground truncate">
            {data.title || 'Untitled'}
          </h3>
          <div className="flex items-center gap-1">
            {hasChildren && (
              <button
                onClick={handleToggleCollapse}
                className="p-1 rounded hover:bg-accent transition-colors"
                title={data.visual.isCollapsed ? 'Expand' : 'Collapse'}
              >
                {data.visual.isCollapsed ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {data.content && !data.visual.isCollapsed && (
          <p className="text-small text-foreground-secondary">
            {data.content.length > 100
              ? `${data.content.substring(0, 100)}...`
              : data.content}
          </p>
        )}

        {renderCitations()}

        <div className="flex items-center gap-3 text-small text-foreground-secondary opacity-80">
          {data.level > 0 && (
            <div className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              <span>L{data.level}</span>
            </div>
          )}
          {data.children && data.children.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{data.children.length}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const shape = data.visual.shape;
  const shapeClass =
    shape === 'circle' ? 'rounded-full' : shape === 'rectangle' ? 'rounded-md' : '';

  const containerStyle: React.CSSProperties = {
    minWidth: 120,
    minHeight: 80,
    backgroundColor: data.visual.color,
    clipPath: shape === 'hexagon' ? HEX_CLIP_PATH : undefined,
  };

  return (
    <div
      className={[
        'group relative cursor-pointer border transition-all duration-150 ease-out',
        'bg-card',
        'border-border shadow-elevation-1 hover:shadow-elevation-2',
        shapeClass,
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background border-primary' : '',
        data.isStreaming ? 'animate-pulse' : '',
        shape === 'diamond' ? 'rotate-45' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={containerStyle}
      onClick={handleNodeClick}
      onDoubleClick={handleDoubleClick}
      data-theme={editorSettings.theme}
    >
      {/* Connection handles */}
      {(!data.visual.isCollapsed || !hasChildren) && (
        <Handle type="target" position={Position.Top} className="w-2 h-2" />
      )}

      {(!data.visual.isCollapsed || !hasChildren) && (
        <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      )}

      <div
        className={[
          'p-3 h-full flex flex-col',
          shape === 'diamond' ? '-rotate-45' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {renderContent()}

        {/* Action buttons */}
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <div className="flex gap-1 rounded-md border border-border bg-popover/80 backdrop-blur-sm shadow-elevation-1 p-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 rounded hover:bg-accent transition-colors"
              title="Edit node"
            >
              <Edit3 className="h-3 w-3" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddChild();
              }}
              className="p-1 rounded hover:bg-accent transition-colors"
              title="Add child node"
            >
              <Plus className="h-3 w-3" />
            </button>

            <button
              onClick={handleDelete}
              className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Delete node"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Streaming indicator */}
        {data.isStreaming && (
          <div className="absolute top-1 left-1">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </div>
  );
}
