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
  Minimize
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
    // Keyboard shortcuts
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
    // Implementation would save current mind map
    alert('Mind map saved successfully!');
  };

  const handleExport = async () => {
    // Implementation would export the mind map
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
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading mind map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error loading mind map</div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Button onClick={handleGoBack}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">No mind map found</div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Please check the URL or create a new mind map</p>
          <Button onClick={handleGoBack}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
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
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mindMap.title}
            </h1>
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreen}
            >
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">General</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Command Palette</span>
                    <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">⌘K</kbd>
                  </div>
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

export default function MindMapEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading mind map editor...</p>
        </div>
      </div>
    }>
      <MindMapEditorContent />
    </Suspense>
  );
}