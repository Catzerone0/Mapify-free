'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MindMapEditorContainer } from '@/components/mindmap/MindMapEditor';
import { RefinementTimeline } from '@/components/mindmap/RefinementTimeline';
import { Button } from '@/components/Button';
import { useMindMapStore } from '@/lib/stores/mindmap';
import {
  ArrowLeft,
  Download,
  Share,
  HelpCircle,
  Maximize,
  Minimize,
} from 'lucide-react';

function MindMapEditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mindMap, isLoading, error } = useMindMapStore();

  const mindMapId = searchParams.get('id');
  const [showTimeline, setShowTimeline] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowHelp(false);
        setShowTimeline(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGoBack = () => {
    router.push('/dashboard');
  };

  const handleSave = async () => {
    alert('Mind map saved successfully!');
  };

  const handleExport = async () => {
    alert('Export functionality coming soon!');
  };

  const handleShare = async () => {
    const shareData = {
      title: mindMap?.title || 'Mind Map',
      text: 'Check out my mind map!',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading mind map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-error text-xl mb-4">Error loading mind map</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleGoBack}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground text-xl mb-4">No mind map found</div>
          <p className="text-muted-foreground mb-4">
            Please check the URL or create a new mind map
          </p>
          <Button onClick={handleGoBack}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <h1 className="text-xl font-semibold text-foreground">{mindMap.title}</h1>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Download className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleFullscreen}>
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTimeline(!showTimeline)}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 relative">
        <MindMapEditorContainer mindMapId={mindMapId || undefined} />
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-popover text-popover-foreground border border-border rounded-md shadow-elevation-3 p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-foreground-secondary hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">General</h4>
                <div className="space-y-2 text-sm">
                  {[
                    ['Command Palette', '⌘K'],
                    ['Undo', '⌘Z'],
                    ['Redo', '⌘⇧Z'],
                    ['Select All', '⌘A'],
                    ['Delete', 'Delete'],
                  ].map(([label, key]) => (
                    <div key={label} className="flex justify-between">
                      <span>{label}</span>
                      <kbd className="px-2 py-1 bg-accent border border-border rounded text-xs">
                        {key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <h4 className="font-semibold mb-2">Mouse Actions</h4>
                <ul className="text-sm space-y-1 text-foreground-secondary">
                  <li>
                    • <strong className="text-foreground">Single click:</strong> Select
                    node
                  </li>
                  <li>
                    • <strong className="text-foreground">Double click:</strong> Edit
                    node
                  </li>
                  <li>
                    • <strong className="text-foreground">Ctrl/Cmd + click:</strong>{' '}
                    Multi-select
                  </li>
                  <li>
                    • <strong className="text-foreground">Drag:</strong> Move nodes
                  </li>
                  <li>
                    • <strong className="text-foreground">Scroll:</strong> Zoom in/out
                  </li>
                </ul>
              </div>

              <div className="mt-4 flex justify-end">
                <Button onClick={() => setShowHelp(false)}>Got it!</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refinement Timeline */}
      {showTimeline && <RefinementTimeline onClose={() => setShowTimeline(false)} />}

      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 right-4 z-50 p-2 bg-black/40 text-white rounded-md hover:bg-black/60 transition-colors"
        >
          <Minimize className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export default function MindMapEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading mind map editor...</p>
          </div>
        </div>
      }
    >
      <MindMapEditorContent />
    </Suspense>
  );
}
