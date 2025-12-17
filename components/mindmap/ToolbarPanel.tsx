'use client';

import React from 'react';
import { useMindMapStore } from '@/lib/stores/mindmap';
import { 
  Settings, 
  Eye, 
  EyeOff,
  Command,
  Save,
  RefreshCw,
  Grid3X3,
  GitBranch,
  BarChart3,
  Share2,
  Download,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/Button';

export interface ToolbarPanelProps {
  onToggleSourcePanel: () => void;
  onToggleControlPanel: () => void;
  onShowCommandPalette: () => void;
  onToggleShareDialog?: () => void;
  onToggleExportMenu?: () => void;
  onToggleAssistantPanel?: () => void;
  onToggleTemplateGallery?: () => void;
}

export function ToolbarPanel({ 
  onToggleSourcePanel, 
  onToggleControlPanel, 
  onShowCommandPalette,
  onToggleShareDialog,
  onToggleExportMenu,
  onToggleAssistantPanel,
  onToggleTemplateGallery
}: ToolbarPanelProps) {
  const {
    mindMap,
    editorSettings,
    streamingProgress,
    updateSettings,
    autoLayout,
    saveChanges,
    clearSelection,
    selectedNodes,
    regenerateBranch,
    expandNode,
    summarizeNode,
  } = useMindMapStore();

  const handleLayoutChange = (layoutType: 'hierarchical' | 'radial' | 'force') => {
    updateSettings({
      layout: {
        ...editorSettings.layout,
        type: layoutType,
      },
    });
  };

  const handleComplexityChange = (complexity: 'simple' | 'moderate' | 'complex') => {
    updateSettings({ complexity });
  };

  const handleSave = () => {
    saveChanges();
  };

  const handleAutoLayout = () => {
    autoLayout();
  };

  const handleRegenerateSelected = async () => {
    if (selectedNodes.length > 0) {
      const nodeId = selectedNodes[0]; // For now, just use the first selected node
      await regenerateBranch(nodeId);
    }
  };

  const handleExpandSelected = async () => {
    if (selectedNodes.length > 0) {
      const nodeId = selectedNodes[0];
      await expandNode(nodeId);
    }
  };

  const handleSummarize = async () => {
    if (mindMap?.id) {
      await summarizeNode(mindMap.id);
    }
  };

  return (
    <div className={`rounded-lg shadow-lg border p-3 ${
      editorSettings.theme === 'dark'
        ? 'bg-gray-800 border-gray-700 text-gray-100'
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-sm">Mind Map Editor</h3>
        <div className="flex-1" />
        
        {/* Theme toggle */}
        <button
          onClick={() => updateSettings({ theme: editorSettings.theme === 'dark' ? 'light' : 'dark' })}
          className={`p-1 rounded ${
            editorSettings.theme === 'dark'
              ? 'hover:bg-gray-700 text-gray-300'
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Toggle theme"
        >
          {editorSettings.theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Main action buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Button
          onClick={handleSave}
          size="sm"
          className="flex items-center gap-2"
          disabled={streamingProgress !== null}
        >
          <Save className="h-4 w-4" />
          Save
        </Button>

        <Button
          onClick={onShowCommandPalette}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <Command className="h-4 w-4" />
          Cmd
        </Button>

        <Button
          onClick={handleAutoLayout}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <Grid3X3 className="h-4 w-4" />
          Auto
        </Button>

        <Button
          onClick={clearSelection}
          size="sm"
          variant="outline"
          disabled={selectedNodes.length === 0}
          className="flex items-center gap-2"
        >
          <EyeOff className="h-4 w-4" />
          Clear
        </Button>
      </div>

      {/* Collaboration & Sharing */}
      <div className="border-t pt-3 mb-3">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Collaboration</h4>
        <div className="grid grid-cols-2 gap-2">
          {onToggleShareDialog && (
            <Button
              onClick={onToggleShareDialog}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          )}

          {onToggleExportMenu && (
            <Button
              onClick={onToggleExportMenu}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}

          {onToggleAssistantPanel && (
            <Button
              onClick={onToggleAssistantPanel}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Ask AI
            </Button>
          )}

          {onToggleTemplateGallery && (
            <Button
              onClick={onToggleTemplateGallery}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Templates
            </Button>
          )}
        </div>
      </div>

      {/* AI Actions */}
      <div className="border-t pt-3 mb-3">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">AI Actions</h4>
        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={handleExpandSelected}
            size="sm"
            variant="outline"
            disabled={selectedNodes.length === 0 || streamingProgress !== null}
            className="flex items-center gap-2"
          >
            <GitBranch className="h-4 w-4" />
            Expand
          </Button>

          <Button
            onClick={handleRegenerateSelected}
            size="sm"
            variant="outline"
            disabled={selectedNodes.length === 0 || streamingProgress !== null}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </Button>

          <Button
            onClick={handleSummarize}
            size="sm"
            variant="outline"
            disabled={!mindMap || streamingProgress !== null}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Summarize
          </Button>
        </div>
      </div>

      {/* Layout controls */}
      <div className="border-t pt-3 mb-3">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Layout</h4>
        <div className="grid grid-cols-3 gap-1">
          {(['hierarchical', 'radial', 'force'] as const).map((layout) => (
            <button
              key={layout}
              onClick={() => handleLayoutChange(layout)}
              className={`p-2 rounded text-xs ${
                editorSettings.layout.type === layout
                  ? 'bg-blue-500 text-white'
                  : editorSettings.theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {layout.charAt(0).toUpperCase() + layout.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Complexity controls */}
      <div className="border-t pt-3 mb-3">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Complexity</h4>
        <div className="grid grid-cols-3 gap-1">
          {(['simple', 'moderate', 'complex'] as const).map((complexity) => (
            <button
              key={complexity}
              onClick={() => handleComplexityChange(complexity)}
              className={`p-2 rounded text-xs ${
                editorSettings.complexity === complexity
                  ? 'bg-blue-500 text-white'
                  : editorSettings.theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {complexity.charAt(0).toUpperCase() + complexity.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Panel toggles */}
      <div className="border-t pt-3">
        <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Panels</h4>
        <div className="space-y-2">
          <button
            onClick={onToggleControlPanel}
            className={`w-full flex items-center gap-2 p-2 rounded text-sm ${
              editorSettings.theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Settings className="h-4 w-4" />
            Control Panel
          </button>

          <button
            onClick={onToggleSourcePanel}
            className={`w-full flex items-center gap-2 p-2 rounded text-sm ${
              editorSettings.theme === 'dark'
                ? 'hover:bg-gray-700 text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Eye className="h-4 w-4" />
            Source Preview
          </button>
        </div>
      </div>

      {/* Status indicator */}
      {streamingProgress && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center gap-2 text-xs">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-500"></div>
            <span className="text-blue-600 dark:text-blue-400">
              {streamingProgress.status === 'generating' && 'Generating...'}
              {streamingProgress.status === 'streaming' && 'Streaming...'}
              {streamingProgress.status === 'complete' && 'Complete!'}
              {streamingProgress.status === 'error' && 'Error'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}