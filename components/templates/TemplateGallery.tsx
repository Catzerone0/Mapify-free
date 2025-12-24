'use client';

import React, { useEffect, useState } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { TemplateData } from '@/lib/templates/templates-data';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface TemplateGalleryProps {
  onClose: () => void;
  onSelectTemplate: (template: TemplateData, topic: string) => void;
}

export function TemplateGallery({ onClose, onSelectTemplate }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data.templates);
        setCategories(['all', ...data.data.categories]);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = () => {
    if (selectedTemplate && topic.trim()) {
      onSelectTemplate(selectedTemplate, topic);
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-popover text-popover-foreground rounded-md shadow-elevation-3 border border-border p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-foreground-secondary mt-4">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-popover text-popover-foreground rounded-md shadow-elevation-3 border border-border max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Template Gallery</h2>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-2/3 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-secondary" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={[
                      'px-3 py-1 rounded-full text-sm font-medium capitalize transition-colors',
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent',
                    ].join(' ')}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => setSelectedTemplate(template)}
                    className={[
                      'p-4 border rounded-md text-left transition-colors',
                      selectedTemplate?.name === template.name
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent',
                    ].join(' ')}
                  >
                    <div className="text-3xl mb-2">{template.icon}</div>
                    <h3 className="font-semibold text-foreground mb-1">{template.name}</h3>
                    <p className="text-sm text-foreground-secondary line-clamp-2">
                      {template.description}
                    </p>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <span className="text-xs px-2 py-1 bg-accent rounded-full capitalize">
                        {template.category}
                      </span>
                      <span className="text-xs px-2 py-1 bg-accent rounded-full capitalize">
                        {template.complexity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-1/3 flex flex-col">
            {selectedTemplate ? (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="text-4xl">{selectedTemplate.icon}</div>
                  <h3 className="text-xl font-semibold">{selectedTemplate.name}</h3>
                  <p className="text-foreground-secondary">{selectedTemplate.description}</p>

                  <div>
                    <Input
                      label="Topic or Subject *"
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Product Launch Plan"
                    />
                    <p className="text-small text-foreground-secondary mt-1">
                      This will be used to generate your mind map
                    </p>
                  </div>

                  <div className="bg-secondary border border-border rounded-md p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Template Preview</h4>
                    <p className="text-small text-foreground-secondary whitespace-pre-wrap">
                      {selectedTemplate.prompt.replace('{{TOPIC}}', topic || '[Your Topic]')}
                    </p>
                  </div>
                </div>

                <div className="p-4 border-t border-border">
                  <Button
                    onClick={handleUseTemplate}
                    disabled={!topic.trim()}
                    className="w-full"
                  >
                    Use This Template
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="text-foreground-secondary">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-60" />
                  <p className="text-sm">Select a template to see details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
