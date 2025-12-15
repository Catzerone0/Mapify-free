'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MindMapEditorContainer } from '@/components/mindmap/MindMapEditor';
import { RefinementTimeline } from '@/components/mindmap/RefinementTimeline';
import { Button } from '@/components/Button';
import { useMindMapStore } from '@/lib/stores/mindmap';
import { 
  ArrowLeft, 
  Download, 
  Share, 
  Settings,
  HelpCircle,
  Maximize,
  Minimize
} from 'lucide-react';

export default function MindMapEditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mindMap, isLoading, error } = useMindMapStore();
  
  const mindMapId = searchParams.get('id');
  const [showTimeline, setShowTimeline] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'k':
            event.preventDefault();
            // Command palette will be handled by the editor component
            break;
          case 's':
            event.preventDefault();
            // Save will be handled by the editor component
            break;
          case 'z':
            if (event.shiftKey) {
              event.preventDefault();
              // Redo will be handled by the store
            } else {
              event.preventDefault();
              // Undo will be handled by the store
            }
            break;
          case 'f':
            event.preventDefault();
            setIsFullscreen(!isFullscreen);
            break;
          case '?':
            event.preventDefault();
            setShowHelp(!showHelp);
            break;
        }
      }
      
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, showHelp]);

  const handleExport = () => {
    if (!mindMap) return;
    
    const dataStr = JSON.stringify(mindMap, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mindMap.title.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!mindMap) return;
    
    const shareData = {
      title: mindMap.title,
      text: `Check out my mind map: ${mindMap.title}`,
      url: window.location.href,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } else {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading mind map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Error Loading Mind Map
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${
      isFullscreen ? 'fixed inset-0 z-50' : ''
    }`}>
      {/* Header */}
      {!isFullscreen && (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {mindMap?.title || 'Mind Map Editor'}
                </h1>
                {mindMap?.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {mindMap.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTimeline(!showTimeline)}
              >
                Timeline
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!mindMap}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={!mindMap}
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4 mr-2" />
                ) : (
                  <Maximize className="h-4 w-4 mr-2" />
                )}
                Fullscreen
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelp(!showHelp)}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Editor Area */}
      <div className="flex h-full">
        <div className="flex-1 relative">
          <MindMapEditorContainer mindMapId={mindMapId || undefined} />
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex items-center justify-center">
          <div className={`max-w-2xl mx-4 rounded-lg shadow-xl border p-6 ${
            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              <Button variant="ghost" onClick={() => setShowHelp(false)}>
                ✕
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">General</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Command Palette</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">⌘K</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Save</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">⌘S</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Fullscreen</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">⌘F</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Help</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">⌘?</kbd>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Editing</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Undo</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">⌘Z</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Redo</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">⌘⇧Z</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Select All</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">⌘A</kbd>
                  </div>
                  <div className="flex justify-between">
                    <span>Delete</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Delete</kbd>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <h4 className="font-medium mb-2">Mouse Actions</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Single click:</strong> Select node</li>
                <li>• <strong>Double click:</strong> Edit node</li>
                <li>• <strong>Ctrl/Cmd + click:</strong> Multi-select</li>
                <li>• <strong>Drag:</strong> Move nodes</li>
                <li>• <strong>Scroll:</strong> Zoom in/out</li>
              </ul>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowHelp(false)}>
                Got it!
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refinement Timeline */}
      {showTimeline && (
        <RefinementTimeline onClose={() => setShowTimeline(false)} />
      )}

      {/* Fullscreen Exit Button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 right-4 z-50 p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-75"
        >
          <Minimize className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}