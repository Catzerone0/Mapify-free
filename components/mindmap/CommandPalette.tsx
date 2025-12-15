'use client';

import React, { useState, useEffect } from 'react';
import { useMindMapStore } from '@/lib/stores/mindmap';
import { Button } from '@/components/Button';
import { 
  Command,
  X,
  Search,
  Plus,
  Save,
  RefreshCw,
  GitBranch,
  BarChart3,
  Settings,
  Grid3X3,
  EyeOff,
  Zap,
  FileText,
  Palette,
  Trash2
} from 'lucide-react';

export interface CommandPaletteProps {
  onClose: () => void;
}

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'actions' | 'ai' | 'layout' | 'view' | 'settings';
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const {
    mindMap,
    selectedNodes,
    editorSettings,
    updateSettings,
    autoLayout,
    clearSelection,
    saveChanges,
    addNode,
    expandNode,
    regenerateBranch,
    summarizeNode,
  } = useMindMapStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const commands: Command[] = [
    // Actions
    {
      id: 'add-root-node',
      title: 'Add Root Node',
      description: 'Create a new root-level node',
      icon: Plus,
      category: 'actions',
      action: () => {
        addNode(null, { title: 'New Root Node' });
        onClose();
      },
    },
    {
      id: 'save',
      title: 'Save Mind Map',
      description: 'Save all changes to the database',
      icon: Save,
      category: 'actions',
      shortcut: 'Ctrl+S',
      action: () => {
        saveChanges();
        onClose();
      },
    },
    {
      id: 'clear-selection',
      title: 'Clear Selection',
      description: 'Deselect all selected nodes',
      icon: EyeOff,
      category: 'actions',
      disabled: selectedNodes.length === 0,
      action: () => {
        clearSelection();
        onClose();
      },
    },
    
    // AI Actions
    {
      id: 'expand-node',
      title: 'Expand Selected Node',
      description: 'Generate children for selected node',
      icon: GitBranch,
      category: 'ai',
      disabled: selectedNodes.length === 0,
      action: () => {
        if (selectedNodes.length > 0) {
          expandNode(selectedNodes[0]);
        }
        onClose();
      },
    },
    {
      id: 'regenerate-node',
      title: 'Regenerate Branch',
      description: 'Regenerate the selected node and its children',
      icon: RefreshCw,
      category: 'ai',
      disabled: selectedNodes.length === 0,
      action: () => {
        if (selectedNodes.length > 0) {
          regenerateBranch(selectedNodes[0]);
        }
        onClose();
      },
    },
    {
      id: 'summarize',
      title: 'Summarize Mind Map',
      description: 'Generate a comprehensive summary',
      icon: BarChart3,
      category: 'ai',
      disabled: !mindMap,
      action: () => {
        if (mindMap) {
          summarizeNode(mindMap.id!);
        }
        onClose();
      },
    },

    // Layout
    {
      id: 'auto-layout',
      title: 'Auto Layout',
      description: 'Automatically arrange all nodes',
      icon: Grid3X3,
      category: 'layout',
      action: () => {
        autoLayout();
        onClose();
      },
    },
    {
      id: 'hierarchical-layout',
      title: 'Hierarchical Layout',
      description: 'Arrange nodes in a tree structure',
      icon: Grid3X3,
      category: 'layout',
      action: () => {
        updateSettings({
          layout: { ...editorSettings.layout, type: 'hierarchical' }
        });
        onClose();
      },
    },
    {
      id: 'radial-layout',
      title: 'Radial Layout',
      description: 'Arrange nodes in a radial pattern',
      icon: Grid3X3,
      category: 'layout',
      action: () => {
        updateSettings({
          layout: { ...editorSettings.layout, type: 'radial' }
        });
        onClose();
      },
    },
    {
      id: 'force-layout',
      title: 'Force-Directed Layout',
      description: 'Use physics simulation for layout',
      icon: Grid3X3,
      category: 'layout',
      action: () => {
        updateSettings({
          layout: { ...editorSettings.layout, type: 'force' }
        });
        onClose();
      },
    },

    // View
    {
      id: 'toggle-theme',
      title: 'Toggle Theme',
      description: 'Switch between light and dark mode',
      icon: Palette,
      category: 'view',
      action: () => {
        updateSettings({ 
          theme: editorSettings.theme === 'dark' ? 'light' : 'dark' 
        });
        onClose();
      },
    },

    // Settings
    {
      id: 'simple-complexity',
      title: 'Set Simple Complexity',
      description: 'Use simple prompting for AI operations',
      icon: Settings,
      category: 'settings',
      action: () => {
        updateSettings({ complexity: 'simple' });
        onClose();
      },
    },
    {
      id: 'moderate-complexity',
      title: 'Set Moderate Complexity',
      description: 'Use moderate prompting for AI operations',
      icon: Settings,
      category: 'settings',
      action: () => {
        updateSettings({ complexity: 'moderate' });
        onClose();
      },
    },
    {
      id: 'complex-complexity',
      title: 'Set Complex Complexity',
      description: 'Use complex prompting for AI operations',
      icon: Settings,
      category: 'settings',
      action: () => {
        updateSettings({ complexity: 'complex' });
        onClose();
      },
    },
  ];

  const categories = [
    { id: 'all', label: 'All Commands' },
    { id: 'actions', label: 'Actions' },
    { id: 'ai', label: 'AI' },
    { id: 'layout', label: 'Layout' },
    { id: 'view', label: 'View' },
    { id: 'settings', label: 'Settings' },
  ];

  const filteredCommands = commands.filter(command => {
    const matchesSearch = command.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         command.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || command.category === activeCategory;
    return matchesSearch && matchesCategory && !command.disabled;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Palette */}
      <div className={`relative w-full max-w-lg mx-4 rounded-lg shadow-2xl border ${
        editorSettings.theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-600">
          <Command className="h-5 w-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className={`flex-1 bg-transparent outline-none ${
              editorSettings.theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            }`}
            autoFocus
          />
          <button
            onClick={onClose}
            className={`p-1 rounded hover:bg-opacity-20 ${
              editorSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-600 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                activeCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : editorSettings.theme === 'dark'
                  ? 'hover:bg-gray-700 text-gray-300'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Commands */}
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.length > 0 ? (
            <div className="p-2">
              {filteredCommands.map(command => {
                const Icon = command.icon;
                return (
                  <button
                    key={command.id}
                    onClick={command.action}
                    disabled={command.disabled}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      command.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : editorSettings.theme === 'dark'
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{command.title}</div>
                      <div className="text-xs opacity-75">{command.description}</div>
                    </div>
                    {command.shortcut && (
                      <div className={`text-xs px-2 py-1 rounded ${
                        editorSettings.theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                      }`}>
                        {command.shortcut}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={`p-8 text-center ${
              editorSettings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-500 hover:text-blue-600 text-sm mt-1"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t text-xs text-center ${
          editorSettings.theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'
        }`}>
          <div className="flex items-center justify-center gap-4">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Cancel</span>
            <span>⌘K Command palette</span>
          </div>
        </div>
      </div>
    </div>
  );
}