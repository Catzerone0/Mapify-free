'use client';

import React, { useState } from 'react';
import { X, Send, Sparkles, Book } from 'lucide-react';

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

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/maps/${mindMapId}/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Assistant
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-500" />
            <p className="text-sm">
              Ask me anything about this mind map!
            </p>
            <p className="text-xs mt-2">
              I can help you find information, explain concepts, and answer questions based on the content.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                  <div className="flex items-center gap-1 mb-2">
                    <Book className="w-3 h-3" />
                    <span className="text-xs font-medium">Sources:</span>
                  </div>
                  <div className="space-y-2">
                    {message.sources.map((source, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-white dark:bg-gray-800 rounded p-2"
                      >
                        <div className="font-medium text-blue-600 dark:text-blue-400">
                          {source.nodeTitle}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {source.nodeContent}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confidence */}
              {message.confidence !== undefined && (
                <div className="mt-2 text-xs opacity-70">
                  Confidence: {Math.round(message.confidence * 100)}%
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Thinking...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-end gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            rows={3}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={askQuestion}
            disabled={loading || !inputValue.trim()}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
