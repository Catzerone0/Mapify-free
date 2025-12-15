'use client';

import React, { useState } from 'react';
import { useMindMapStore } from '@/lib/stores/mindmap';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { 
  X, 
  FileText, 
  ExternalLink, 
  Search, 
  Download,
  Eye,
  EyeOff,
  Hash,
  Clock,
  BarChart3
} from 'lucide-react';

export interface SourcePreviewPanelProps {
  summary?: string;
  sources?: Array<{
    id: string;
    title: string;
    url: string;
    content?: string;
    author?: string;
    createdAt?: Date;
  }>;
  onClose: () => void;
}

export function SourcePreviewPanel({ summary, sources = [], onClose }: SourcePreviewPanelProps) {
  const { editorSettings, mindMap } = useMindMapStore();
  const [activeTab, setActiveTab] = useState<'summary' | 'sources' | 'metadata'>('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  const filteredSources = sources.filter(source =>
    source.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSourceExpansion = (sourceId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(sourceId)) {
      newExpanded.delete(sourceId);
    } else {
      newExpanded.add(sourceId);
    }
    setExpandedSources(newExpanded);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className={`fixed left-4 top-20 w-96 max-h-[80vh] rounded-lg shadow-lg border p-4 overflow-hidden ${
      editorSettings.theme === 'dark'
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Source Preview</h3>
        <button 
          onClick={onClose} 
          className={`p-1 rounded hover:bg-opacity-20 ${
            editorSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex mb-4 border-b border-gray-200 dark:border-gray-600">
        {[
          { id: 'summary', label: 'Summary', icon: FileText },
          { id: 'sources', label: 'Sources', icon: ExternalLink },
          { id: 'metadata', label: 'Metadata', icon: Hash },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'summary' | 'sources' | 'metadata')}
            className={`flex items-center gap-2 px-3 py-2 text-sm border-b-2 transition-colors ${
              activeTab === id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {summary && (
              <div>
                <h4 className="font-medium mb-2">Mind Map Summary</h4>
                <div className={`p-3 rounded border ${
                  editorSettings.theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <p className="text-sm leading-relaxed">{summary}</p>
                </div>
              </div>
            )}

            {mindMap?.prompt && (
              <div>
                <h4 className="font-medium mb-2">Original Prompt</h4>
                <div className={`p-3 rounded border ${
                  editorSettings.theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <p className="text-sm italic">{mindMap.prompt}</p>
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div>
              <h4 className="font-medium mb-2">Statistics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded border ${
                  editorSettings.theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">Total Nodes</p>
                      <p className="font-semibold">{mindMap?.metadata.totalNodes || 0}</p>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded border ${
                  editorSettings.theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500">Max Depth</p>
                      <p className="font-semibold">{mindMap?.metadata.maxDepth || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                editorSettings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sources..."
                className="pl-10"
              />
            </div>

            {/* Sources count */}
            <div className="text-sm text-gray-500">
              {filteredSources.length} source{filteredSources.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>

            {/* Sources list */}
            <div className="space-y-2">
              {filteredSources.map((source) => (
                <div
                  key={source.id}
                  className={`border rounded-lg ${
                    editorSettings.theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-sm line-clamp-2">{source.title}</h5>
                      <button
                        onClick={() => toggleSourceExpansion(source.id)}
                        className={`p-1 rounded hover:bg-opacity-20 ml-2 ${
                          editorSettings.theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                      >
                        {expandedSources.has(source.id) ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 mb-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {source.url}
                      </a>
                    )}

                    {source.author && (
                      <p className="text-xs text-gray-500 mb-2">by {source.author}</p>
                    )}

                    {source.createdAt && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <Clock className="h-3 w-3" />
                        {formatDate(source.createdAt)}
                      </div>
                    )}

                    {expandedSources.has(source.id) && source.content && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs leading-relaxed">{source.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredSources.length === 0 && (
                <div className={`text-center py-8 ${
                  editorSettings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No sources found</p>
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
          </div>
        )}

        {activeTab === 'metadata' && mindMap && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Mind Map Details</h4>
              <div className="space-y-3">
                <div className={`p-3 rounded border ${
                  editorSettings.theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Title:</span>
                      <p className="font-medium">{mindMap.title}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Complexity:</span>
                      <p className="font-medium capitalize">{mindMap.complexity}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Provider:</span>
                      <p className="font-medium">{mindMap.provider || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <p className="font-medium">
                        {mindMap.metadata.createdAt
                          ? formatDate(mindMap.metadata.createdAt)
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>

                {mindMap.description && (
                  <div>
                    <span className="text-sm text-gray-500">Description:</span>
                    <p className="text-sm mt-1">{mindMap.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Node statistics */}
            <div>
              <h4 className="font-medium mb-3">Node Statistics</h4>
              <div className="space-y-2">
                <div className={`p-2 rounded border ${
                  editorSettings.theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex justify-between text-sm">
                    <span>Root Nodes:</span>
                    <span className="font-medium">{mindMap.rootNodes.length}</span>
                  </div>
                </div>
                
                <div className={`p-2 rounded border ${
                  editorSettings.theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex justify-between text-sm">
                    <span>Total Nodes:</span>
                    <span className="font-medium">{mindMap.metadata.totalNodes}</span>
                  </div>
                </div>

                <div className={`p-2 rounded border ${
                  editorSettings.theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex justify-between text-sm">
                    <span>Max Depth:</span>
                    <span className="font-medium">{mindMap.metadata.maxDepth}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Export options */}
            <div>
              <h4 className="font-medium mb-3">Export</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    const dataStr = JSON.stringify(mindMap, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${mindMap.title.replace(/\s+/g, '_')}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-3 w-3" />
                  JSON
                </Button>

                <Button
                  onClick={() => {
                    const text = `${mindMap.title}\n\n${mindMap.summary || ''}\n\nNodes: ${mindMap.metadata.totalNodes}`;
                    const dataBlob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${mindMap.title.replace(/\s+/g, '_')}.txt`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-3 w-3" />
                  Text
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}