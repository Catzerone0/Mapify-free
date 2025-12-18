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
} from 'lucide-react';

type ContentType = 'text' | 'youtube' | 'pdf' | 'web' | 'file';
type ComplexityLevel = 'simple' | 'moderate' | 'complex';
type Provider = 'openai' | 'gemini';

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
    } catch (error) {
      console.error('Failed to fetch available providers:', error);
    }
  }, [provider]);

  useEffect(() => {
    if (!workspaceId) {
      router.push('/dashboard');
      return;
    }
    fetchAvailableProviders();
  }, [workspaceId, router, fetchAvailableProviders]);

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
                        YouTube URL
                      </label>
                      <Input
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        type="url"
                      />
                    </div>
                  )}

                  {contentType === 'web' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Website URL
                      </label>
                      <Input
                        value={webUrl}
                        onChange={(e) => setWebUrl(e.target.value)}
                        placeholder="https://example.com"
                        type="url"
                      />
                    </div>
                  )}

                  {contentType === 'pdf' && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        PDF File
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      {pdfFile && (
                        <p className="text-xs text-foreground-secondary mt-1">
                          Selected: {pdfFile.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-lg font-semibold text-foreground">Generation Settings</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      AI Provider
                    </label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value as Provider)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {availableProviders.map((p) => (
                        <option key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Complexity Level */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Complexity Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['simple', 'moderate', 'complex'] as ComplexityLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => setComplexity(level)}
                          className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                            complexity === level
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-foreground hover:border-primary/50'
                          }`}
                        >
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {progress.status === 'error' && (
              <Card className="mb-6 border-error/20 bg-error/5">
                <CardContent className="pt-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-error mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-error mb-1">Error</p>
                      <p className="text-sm text-foreground">{progress.error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                onClick={handleGoBack}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={
                  !prompt.trim() && contentType === 'text' ||
                  !youtubeUrl.trim() && contentType === 'youtube' ||
                  !webUrl.trim() && contentType === 'web' ||
                  !pdfFile && contentType === 'pdf'
                }
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Generate Mind Map
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
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div>Loading...</div></div>}>
      <MindMapCreateContent />
    </Suspense>
  );
}
