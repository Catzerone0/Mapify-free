'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles } from 'lucide-react';
import { TemplateData } from '@/lib/templates/templates-data';

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
    } catch (error) {
      console.error('Error fetching templates:', error);
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Template Gallery
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left sidebar - Templates list */}
          <div className="w-2/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Search and filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      selectedTemplate?.name === template.name
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-3xl mb-2">{template.icon}</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded capitalize">
                        {template.category}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded capitalize">
                        {template.complexity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar - Template details */}
          <div className="w-1/3 flex flex-col">
            {selectedTemplate ? (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <div className="text-4xl">{selectedTemplate.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedTemplate.description}
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Topic or Subject *
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Product Launch Plan"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      This will be used to generate your mind map
                    </p>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Template Preview
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {selectedTemplate.prompt.replace('{{TOPIC}}', topic || '[Your Topic]')}
                    </p>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleUseTemplate}
                    disabled={!topic.trim()}
                    className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Use This Template
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                <div className="text-gray-400 dark:text-gray-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-sm">
                    Select a template to see details
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
