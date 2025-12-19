'use client';

import React, { useState } from 'react';
import { Book, Send, Sparkles, X } from 'lucide-react';

interface AssistantPanelProps {
  mindMapId: string;
  onClose: () => void;
}

interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: {
    nodeId: string;
    nodeTitle: string;
    nodeContent: string;
  }[];
  confidence?: number;
}

export function AssistantPanel({ mindMapId, onClose }: AssistantPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!inputValue.trim() || loading) return;

    const question = inputValue.trim();
    setInputValue('');

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/maps/${mindMapId}/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.data.answer,
            sources: data.data.sources,
            confidence: data.data.confidence,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Error: ${data.message}`,
          },
        ]);
      }
    } catch (error) {
      console.error('Error asking question:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your question.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-popover text-popover-foreground shadow-elevation-3 border-l border-border flex flex-col z-40">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="text-foreground-secondary hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-foreground-secondary mt-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
            <p className="text-sm">Ask me anything about this mind map!</p>
            <p className="text-small mt-2">
              I can help you find information, explain concepts, and answer questions based on
              the content.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={[
                'max-w-[85%] rounded-md p-3',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground',
              ].join(' ')}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-1 mb-2 text-small text-foreground-secondary">
                    <Book className="w-3 h-3" />
                    <span className="font-medium">Sources:</span>
                  </div>
                  <div className="space-y-2">
                    {message.sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="text-small bg-background/60 rounded-md border border-border p-2"
                      >
                        <div className="font-medium text-primary">{source.nodeTitle}</div>
                        <div className="text-foreground-secondary mt-1 line-clamp-2">
                          {source.nodeContent}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {message.confidence !== undefined && (
                <div className="mt-2 text-xs text-foreground-secondary">
                  Confidence: {Math.round(message.confidence * 100)}%
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-md p-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-foreground-secondary">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask a question..."
            rows={3}
            className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
          />
          <button
            onClick={askQuestion}
            disabled={loading || !inputValue.trim()}
            className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-small text-foreground-secondary mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
