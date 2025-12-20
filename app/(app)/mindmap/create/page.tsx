'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader } from '@/components/Card';
import { Input } from '@/components/Input';
import {
  ArrowLeft,
  Loader,
  AlertCircle,
  FileText,
  Globe,
  Music,
  Upload,
  CheckCircle,
  Zap,
  Settings,
} from 'lucide-react';

type ContentType = 'text' | 'youtube' | 'pdf' | 'web' | 'file';
type ComplexityLevel = 'simple' | 'moderate' | 'detailed' | 'expert';
type Provider = 'openai' | 'gemini';
type Style = 'hierarchical' | 'radial' | 'mindmap' | 'flowchart';

interface GenerationProgress {
  status: 'idle' | 'processing' | 'streaming' | 'completed' | 'error';
  message: string;
  progress: number;
  error?: string;
}

function MindMapCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspace');

  // Form state
  const [contentType, setContentType] = useState<ContentType>('text');
  const [prompt, setPrompt] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<Provider>('openai');
  const [complexity, setComplexity] = useState<ComplexityLevel>('moderate');
  const [style, setStyle] = useState<Style>('mindmap');
  const [depth, setDepth] = useState(2);
  const [includeCitations, setIncludeCitations] = useState(true);
  const [autoSummarize, setAutoSummarize] = useState(false);
  const [language, setLanguage] = useState('English');
  
  const [availableProviders, setAvailableProviders] = useState<Provider[]>(['openai']);

  // Generation state
  const [progress, setProgress] = useState<GenerationProgress>({
    status: 'idle',
    message: '',
    progress: 0,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const fetchAvailableProviders = React.useCallback(async () => {
    try {
      const response = await fetch('/api/llm-keys', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const providerKeys = data.data || [];
        const providers: Provider[] = providerKeys
          .map((key: { provider: string }) => key.provider as Provider)
          .filter((p: Provider) => ['openai', 'gemini'].includes(p));
        
        if (providers.length === 0) {
          setAvailableProviders(['openai']);
        } else {
          setAvailableProviders(providers);
          if (!providers.includes(provider)) {
            setProvider(providers[0]);
          }
        }
      }
    } catch {
      // Silently handle - provider selection is not critical
    }
  }, [provider]);

  useEffect(() => {
    if (!workspaceId) {
      const stored = localStorage.getItem('current_workspace_id');
      if (stored) {
        router.replace(`/mindmap/create?workspace=${stored}`);
        return;
      }
      router.push('/dashboard');
      return;
    }
    fetchAvailableProviders();
  }, [workspaceId, router, fetchAvailableProviders]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('mapify_template');
      if (!raw) return;
      const t = JSON.parse(raw) as { prompt?: string; complexity?: ComplexityLevel };
      if (t.prompt) {
        setContentType('text');
        setPrompt(t.prompt);
      }
      if (t.complexity) {
        setComplexity(t.complexity);
      }
      localStorage.removeItem('mapify_template');
    } catch {
      // ignore
    }
  }, []);

  const validateInput = (): boolean => {
    if (contentType === 'text' && !prompt.trim()) {
      setProgress({
        status: 'error',
        message: 'Please enter a prompt',
        progress: 0,
        error: 'Prompt is required for text input',
      });
      return false;
    }

    if (contentType === 'youtube' && !youtubeUrl.trim()) {
      setProgress({
        status: 'error',
        message: 'Please enter a YouTube URL',
        progress: 0,
        error: 'YouTube URL is required',
      });
      return false;
    }

    if (contentType === 'web' && !webUrl.trim()) {
      setProgress({
        status: 'error',
        message: 'Please enter a URL',
        progress: 0,
        error: 'URL is required',
      });
      return false;
    }

    if (contentType === 'pdf' && !pdfFile) {
      setProgress({
        status: 'error',
        message: 'Please select a PDF file',
        progress: 0,
        error: 'PDF file is required',
      });
      return false;
    }

    return true;
  };

  const handleGenerate = async () => {
    if (!validateInput() || !workspaceId) return;

    setIsGenerating(true);
    setProgress({
      status: 'processing',
      message: 'Preparing your request...',
      progress: 10,
    });

    try {
      const form = new FormData();
      form.append('workspaceId', workspaceId);
      form.append('complexity', complexity);
      form.append('provider', provider);
      form.append('contentType', contentType);
      form.append('style', style);
      form.append('depth', depth.toString());
      form.append('includeCitations', includeCitations.toString());
      form.append('autoSummarize', autoSummarize.toString());
      form.append('language', language);

      // Add content based on type
      if (contentType === 'text') {
        form.append('prompt', prompt);
      } else if (contentType === 'youtube') {
        form.append('youtubeUrl', youtubeUrl);
      } else if (contentType === 'web') {
        form.append('webUrl', webUrl);
      } else if (contentType === 'pdf' && pdfFile) {
        form.append('pdfFile', pdfFile);
      }

      setProgress({
        status: 'processing',
        message: 'Sending request to server...',
        progress: 20,
      });

      const response = await fetch('/api/maps/generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: form,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      // Check if we have a stream or regular response
      const responseContentType = response.headers.get('content-type');
      if (responseContentType?.includes('text/event-stream')) {
        // Handle streaming response
        handleStreamingResponse(response);
      } else {
        // Handle regular response
        const data = await response.json();
        if (data.success && data.data?.id) {
          setProgress({
            status: 'completed',
            message: 'Mind map generated successfully!',
            progress: 100,
          });
          // Redirect to editor after a short delay
          setTimeout(() => {
            router.push(`/mindmap/editor?id=${data.data.id}`);
          }, 500);
        } else {
          throw new Error(data.error || 'Generation failed');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      setProgress({
        status: 'error',
        message: 'Generation failed',
        progress: 0,
        error: errorMessage,
      });
      setIsGenerating(false);
    }
  };

  const handleStreamingResponse = (response: Response) => {
    setProgress({
      status: 'streaming',
      message: 'Generating mind map structure...',
      progress: 30,
    });

    const reader = response.body?.getReader();
    if (!reader) {
      setProgress({
        status: 'error',
        message: 'Failed to read response stream',
        progress: 0,
        error: 'Stream unavailable',
      });
      setIsGenerating(false);
      return;
    }

    let mapId: string | null = null;
    let nodeCount = 0;
    const decoder = new TextDecoder();

    const readStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'start') {
                  setProgress({
                    status: 'streaming',
                    message: 'Starting generation...',
                    progress: 35,
                  });
                } else if (data.type === 'node') {
                  nodeCount++;
                  setProgress({
                    status: 'streaming',
                    message: `Generated ${nodeCount} nodes...`,
                    progress: Math.min(35 + (nodeCount * 2), 90),
                  });
                } else if (data.type === 'map') {
                  mapId = data.mapId;
                  setProgress({
                    status: 'streaming',
                    message: 'Finalizing mind map...',
                    progress: 95,
                  });
                } else if (data.type === 'complete') {
                  setProgress({
                    status: 'completed',
                    message: 'Mind map generated successfully!',
                    progress: 100,
                  });
                  if (mapId) {
                    setTimeout(() => {
                      router.push(`/mindmap/editor?id=${mapId}`);
                    }, 500);
                  }
                } else if (data.type === 'error') {
                  throw new Error(data.error || 'Generation error');
                }
              }
            } catch {
              // Ignore parse errors for non-JSON lines
            }
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Stream error';
        setProgress({
          status: 'error',
          message: 'Generation failed',
          progress: 0,
          error: errorMessage,
        });
        setIsGenerating(false);
      }
    };

    readStream();
  };

  const handleCancel = () => {
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
    setIsGenerating(false);
    setProgress({
      status: 'idle',
      message: '',
      progress: 0,
    });
  };

  const handleGoBack = () => {
    router.push(`/workspace/${workspaceId}`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      setProgress({
        status: 'error',
        message: 'Invalid file',
        progress: 0,
        error: 'Please select a PDF file',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-secondary">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              disabled={isGenerating}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create Mind Map</h1>
              <p className="text-sm text-foreground-secondary">
                Generate a new mind map from your content
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {isGenerating ? (
          // Generation Progress View
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {progress.message}
                    </span>
                    <span className="text-sm text-foreground-secondary">
                      {progress.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-background-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>

                {/* Status Message */}
                <div className="flex items-start space-x-3">
                  {progress.status === 'error' ? (
                    <>
                      <AlertCircle className="h-5 w-5 text-error mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-error mb-1">
                          {progress.error}
                        </p>
                      </div>
                    </>
                  ) : progress.status === 'completed' ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground">{progress.message}</p>
                    </>
                  ) : (
                    <>
                      <Loader className="h-5 w-5 text-primary mt-0.5 flex-shrink-0 animate-spin" />
                      <p className="text-sm text-foreground">{progress.message}</p>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2">
                  {progress.status === 'error' && (
                    <Button
                      onClick={() => {
                        setIsGenerating(false);
                        setProgress({ status: 'idle', message: '', progress: 0 });
                      }}
                      variant="primary"
                    >
                      Try Again
                    </Button>
                  )}
                  {progress.status !== 'completed' && progress.status !== 'idle' && (
                    <Button
                      onClick={handleCancel}
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Creation Form
          <>
            {/* Content Type Selection */}
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-lg font-semibold text-foreground">Content Source</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { id: 'text', label: 'Text', icon: FileText },
                    { id: 'youtube', label: 'YouTube', icon: Music },
                    { id: 'web', label: 'Website', icon: Globe },
                    { id: 'pdf', label: 'PDF', icon: FileText },
                    { id: 'file', label: 'File', icon: Upload },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setContentType(id as ContentType)}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        contentType === id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="h-6 w-6 mx-auto mb-2 text-foreground-secondary" />
                      <span className="text-xs font-medium text-foreground">{label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content Input */}
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-lg font-semibold text-foreground">Your Content</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contentType === 'text' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Enter your prompt or text
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Write your content here or describe what you want your mind map to cover..."
                        rows={6}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-foreground-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <p className="text-xs text-foreground-secondary mt-1">
                        {prompt.length}/2000 characters
                      </p>
                    </div>
                  )}

                  {contentType === 'youtube' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        YouTube Video URL
                      </label>
                      <Input
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        icon={<Music className="h-4 w-4" />}
                      />
                    </div>
                  )}

                  {contentType === 'web' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Webpage URL
                      </label>
                      <Input
                        value={webUrl}
                        onChange={(e) => setWebUrl(e.target.value)}
                        placeholder="https://example.com/article"
                        icon={<Globe className="h-4 w-4" />}
                      />
                    </div>
                  )}

                  {contentType === 'pdf' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Upload PDF Document
                      </label>
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-background-secondary transition-colors relative">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="h-8 w-8 mx-auto mb-2 text-foreground-secondary" />
                        <p className="text-sm font-medium text-foreground">
                          {pdfFile ? pdfFile.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-foreground-secondary mt-1">
                          PDF files up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {contentType === 'file' && (
                    <div className="text-center py-8 text-foreground-secondary">
                      File upload support coming soon
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generation Settings */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <h2 className="text-lg font-semibold text-foreground">Generation Settings</h2>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      AI Provider
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['openai', 'gemini'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setProvider(p as Provider)}
                          disabled={!availableProviders.includes(p as Provider)}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            provider === p
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border text-foreground-secondary hover:border-primary/50'
                          } ${!availableProviders.includes(p as Provider) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className="text-sm font-medium capitalize">{p}</span>
                        </button>
                      ))}
                    </div>
                    {availableProviders.length === 0 && (
                      <p className="text-xs text-error mt-2">
                        No API keys configured. Please add keys in settings.
                      </p>
                    )}
                  </div>

                  {/* Complexity */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Complexity Level
                    </label>
                    <select
                      value={complexity}
                      onChange={(e) => setComplexity(e.target.value as ComplexityLevel)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="simple">Simple (Key points only)</option>
                      <option value="moderate">Standard (Balanced depth)</option>
                      <option value="detailed">Detailed (Comprehensive)</option>
                      <option value="expert">Expert (Deep analysis)</option>
                    </select>
                  </div>

                  {/* Style */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Visual Style
                    </label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value as Style)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="mindmap">Classic Mind Map</option>
                      <option value="hierarchical">Hierarchical (Top-Down)</option>
                      <option value="radial">Radial (Center-Out)</option>
                      <option value="flowchart">Flowchart (Sequential)</option>
                    </select>
                  </div>

                  {/* Depth */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Branch Depth (Levels: {depth})
                    </label>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={depth}
                        onChange={(e) => setDepth(parseInt(e.target.value))}
                        className="w-full accent-primary"
                      />
                    </div>
                  </div>
                  
                  {/* Language */}
                   <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Output Language
                    </label>
                    <Input
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      placeholder="e.g. English, Spanish, French"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="md:col-span-2 flex flex-col md:flex-row gap-6 mt-2">
                     <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={includeCitations} 
                          onChange={(e) => setIncludeCitations(e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary h-5 w-5"
                        />
                        <span className="text-sm font-medium text-foreground">Include Citations</span>
                     </label>
                     
                     <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={autoSummarize} 
                          onChange={(e) => setAutoSummarize(e.target.checked)}
                          className="rounded border-gray-300 text-primary focus:ring-primary h-5 w-5"
                        />
                        <span className="text-sm font-medium text-foreground">Auto-summarize</span>
                     </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="flex justify-end pb-8">
              <Button
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating || availableProviders.length === 0}
                className="w-full md:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Mind Map
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function MindMapCreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <MindMapCreateContent />
    </Suspense>
  );
}
