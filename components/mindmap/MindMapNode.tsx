'use client';

import React, { useState, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MapNodeData, Citation } from '@/lib/ai/types';
import { useMindMapStore } from '@/lib/stores/mindmap';
import { 
  Edit3, 
  Plus, 
  Trash2, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Hash,
  Users
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

const shapeStyles = {
  rectangle: 'rounded-lg',
  circle: 'rounded-full',
  diamond: 'rotate-45',
  hexagon: 'clip-hexagon',
};

const defaultColors = {
  light: {
    primary: '#3b82f6',
    secondary: '#1e40af',
    background: '#ffffff',
    border: '#e5e7eb',
    text: '#1f2937',
  },
  dark: {
    primary: '#60a5fa',
    secondary: '#3b82f6',
    background: '#1f2937',
    border: '#374151',
    text: '#f9fafb',
  },
};

export function MindMapNode({ data, selected }: MindMapNodeProps) {
  const { editorSettings } = useMindMapStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.title || data.content);

  const colors = defaultColors[editorSettings.theme];
  const shapeStyle = shapeStyles[data.visual.shape];
  const hasChildren = data.children && data.children.length > 0;

  // Handle double-click to edit
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(data.title || data.content);
  }, [data.title, data.content]);

  // Save edit
  const handleSaveEdit = useCallback(() => {
    if (data.onEdit) {
      const updates: Partial<MapNodeData> = {
        title: editValue.split('\n')[0], // First line as title
        content: editValue,
      };
      data.onEdit(updates);
    }
    setIsEditing(false);
  }, [editValue, data]);

  // Cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditValue(data.title || data.content);
    setIsEditing(false);
  }, [data]);

  // Handle key press in edit mode
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  // Add child node
  const handleAddChild = useCallback(() => {
    if (data.onAddChild) {
      data.onAddChild();
    }
  }, [data]);

  // Toggle collapse
  const handleToggleCollapse = useCallback(() => {
    if (data.onEdit) {
      data.onEdit({
        visual: {
          ...data.visual,
          isCollapsed: !data.visual.isCollapsed,
        },
      });
    }
  }, [data]);

  // Handle clicks
  const handleNodeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onSelect) {
      data.onSelect();
    }
  }, [data]);

  // Handle delete
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete) {
      data.onDelete();
    }
  }, [data]);

  // Render citations
  const renderCitations = () => {
    if (!data.citations || data.citations.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {data.citations.slice(0, 2).map((citation, index) => (
          <div key={citation.id || index} className="flex items-center gap-1 text-xs opacity-75">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{citation.title}</span>
          </div>
        ))}
        {data.citations.length > 2 && (
          <div className="text-xs opacity-50">
            +{data.citations.length - 2} more
          </div>
        )}
      </div>
    );
  };

  // Render node content
  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-2">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`w-full p-2 text-sm resize-none border rounded ${
              editorSettings.theme === 'dark'
                ? 'bg-gray-800 border-gray-600 text-gray-100'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
            rows={3}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className={`px-2 py-1 text-xs rounded ${
                editorSettings.theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className={`font-medium text-sm ${editorSettings.theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            {data.title || 'Untitled'}
          </h3>
          <div className="flex items-center gap-1">
            {hasChildren && (
              <button
                onClick={handleToggleCollapse}
                className={`p-1 rounded hover:bg-opacity-20 ${
                  editorSettings.theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                }`}
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
          <p className={`text-xs ${editorSettings.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {data.content.length > 100
              ? `${data.content.substring(0, 100)}...`
              : data.content}
          </p>
        )}

        {renderCitations()}

        {/* Node metadata */}
        <div className="flex items-center gap-2 text-xs opacity-50">
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

  const baseNodeClasses = `
    relative border-2 cursor-pointer transition-all duration-200 hover:shadow-lg
    ${shapeStyle}
    ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
    ${data.isStreaming ? 'animate-pulse' : ''}
  `;

  const dynamicStyles = {
    backgroundColor: data.visual.color || colors.background,
    borderColor: data.isSelected ? colors.primary : colors.border,
    color: colors.text,
    borderWidth: '2px',
    minWidth: '120px',
    minHeight: '80px',
  };

  return (
    <div
      className={baseNodeClasses}
      style={dynamicStyles}
      onClick={handleNodeClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Connection handles */}
      {(!data.visual.isCollapsed || !hasChildren) && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-2 h-2"
        />
      )}
      
      {(!data.visual.isCollapsed || !hasChildren) && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-2 h-2"
        />
      )}

      {/* Node content */}
      <div className="p-3 h-full flex flex-col">
        {renderContent()}

        {/* Action buttons */}
        <div className={`absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
          editorSettings.theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } rounded p-1 shadow`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className={`p-1 rounded hover:bg-opacity-20 ${
              editorSettings.theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
            title="Edit node"
          >
            <Edit3 className="h-3 w-3" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddChild();
            }}
            className={`p-1 rounded hover:bg-opacity-20 ${
              editorSettings.theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
            title="Add child node"
          >
            <Plus className="h-3 w-3" />
          </button>
          
          <button
            onClick={handleDelete}
            className="p-1 rounded hover:bg-red-500 hover:text-white"
            title="Delete node"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        {/* Streaming indicator */}
        {data.isStreaming && (
          <div className="absolute top-1 left-1">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}