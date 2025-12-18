'use client';

import React, { useState } from 'react';
import { useMindMapStore } from '@/lib/stores/mindmap';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import {
  BarChart3,
  Clock,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Hash,
  Search,
  X,
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

export function SourcePreviewPanel({
  summary,
  sources = [],
  onClose,
}: SourcePreviewPanelProps) {
  const { mindMap } = useMindMapStore();
  const [activeTab, setActiveTab] = useState<'summary' | 'sources' | 'metadata'>('summary');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  const filteredSources = sources.filter(
    (source) =>
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
    <div className="fixed left-4 top-20 w-96 max-h-[80vh] rounded-md shadow-elevation-2 border border-border bg-popover text-popover-foreground p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Source Preview</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex mb-4 border-b border-border">
        {[
          { id: 'summary', label: 'Summary', icon: FileText },
          { id: 'sources', label: 'Sources', icon: ExternalLink },
          { id: 'metadata', label: 'Metadata', icon: Hash },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'summary' | 'sources' | 'metadata')}
            className={[
              'flex items-center gap-2 px-3 py-2 text-sm border-b-2 transition-colors',
              activeTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground-secondary hover:text-foreground',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            {summary && (
              <div>
                <h4 className="font-medium mb-2">Mind Map Summary</h4>
                <div className="p-3 rounded-md border border-border bg-secondary">
                  <p className="text-sm leading-relaxed">{summary}</p>
                </div>
              </div>
            )}

            {mindMap?.prompt && (
              <div>
                <h4 className="font-medium mb-2">Original Prompt</h4>
                <div className="p-3 rounded-md border border-border bg-secondary">
                  <p className="text-sm italic">{mindMap.prompt}</p>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-2">Statistics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md border border-border bg-secondary">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-small text-foreground-secondary">Total Nodes</p>
                      <p className="font-semibold">{mindMap?.metadata.totalNodes || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-md border border-border bg-secondary">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-foreground" />
                    <div>
                      <p className="text-small text-foreground-secondary">Max Depth</p>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sources..."
                className="pl-10"
              />
            </div>

            <div className="text-sm text-foreground-secondary">
              {filteredSources.length} source{filteredSources.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>

            <div className="space-y-2">
              {filteredSources.map((source) => (
                <div
                  key={source.id}
                  className="border border-border rounded-md bg-secondary"
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h5 className="font-medium text-sm line-clamp-2">{source.title}</h5>
                      <button
                        onClick={() => toggleSourceExpansion(source.id)}
                        className="p-1 rounded hover:bg-accent transition-colors"
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
                        className="text-small text-primary hover:text-primary-dark flex items-center gap-1 mb-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">{source.url}</span>
                      </a>
                    )}

                    {source.author && (
                      <p className="text-small text-foreground-secondary mb-2">
                        by {source.author}
                      </p>
                    )}

                    {source.createdAt && (
                      <div className="flex items-center gap-1 text-small text-foreground-secondary mb-2">
                        <Clock className="h-3 w-3" />
                        {formatDate(source.createdAt)}
                      </div>
                    )}

                    {expandedSources.has(source.id) && source.content && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-small leading-relaxed">{source.content}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredSources.length === 0 && (
                <div className="text-center py-8 text-foreground-secondary">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No sources found</p>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-primary hover:text-primary-dark text-sm mt-1"
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
                <div className="p-3 rounded-md border border-border bg-secondary">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-foreground-secondary">Title:</span>
                      <p className="font-medium">{mindMap.title}</p>
                    </div>
                    <div>
                      <span className="text-foreground-secondary">Complexity:</span>
                      <p className="font-medium capitalize">{mindMap.complexity}</p>
                    </div>
                    <div>
                      <span className="text-foreground-secondary">Provider:</span>
                      <p className="font-medium">{mindMap.provider || 'Unknown'}</p>
                    </div>
                    <div>
                      <span className="text-foreground-secondary">Created:</span>
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
                    <span className="text-sm text-foreground-secondary">Description:</span>
                    <p className="text-sm mt-1">{mindMap.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Node Statistics</h4>
              <div className="space-y-2">
                {[
                  ['Root Nodes', mindMap.rootNodes.length],
                  ['Total Nodes', mindMap.metadata.totalNodes],
                  ['Max Depth', mindMap.metadata.maxDepth],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="p-2 rounded-md border border-border bg-secondary"
                  >
                    <div className="flex justify-between text-sm">
                      <span>{label}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
