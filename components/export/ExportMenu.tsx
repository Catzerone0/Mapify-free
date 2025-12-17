'use client';

import React, { useState } from 'react';
import { Download, FileText, Image as ImageIcon, FileJson, X } from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';

interface ExportMenuProps {
  mindMapId: string;
  mindMapTitle: string;
  onClose: () => void;
}

export function ExportMenu({ mindMapId, mindMapTitle, onClose }: ExportMenuProps) {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'text' | 'json' | 'png' | 'jpg' | null>(null);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportText = async (format: 'markdown' | 'text' | 'json') => {
    setExporting(true);
    setExportFormat(format);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/maps/${mindMapId}/export?format=${format}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const content = await response.text();
        const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `mindmap.${format}`;
        const mimeType = response.headers.get('Content-Type') || 'text/plain';
        
        downloadFile(content, filename, mimeType);
      } else {
        alert('Failed to export mind map');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export mind map');
    } finally {
      setExporting(false);
      setExportFormat(null);
    }
  };

  const exportImage = async (format: 'png' | 'jpg') => {
    setExporting(true);
    setExportFormat(format);

    try {
      // Find the React Flow container
      const flowElement = document.querySelector('.react-flow') as HTMLElement;
      
      if (!flowElement) {
        alert('Could not find mind map to export');
        return;
      }

      // Export to image
      const dataUrl = format === 'png'
        ? await toPng(flowElement, { quality: 1, pixelRatio: 2 })
        : await toJpeg(flowElement, { quality: 0.95, pixelRatio: 2 });

      // Download the image
      const link = document.createElement('a');
      link.download = `${mindMapTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Failed to export image');
    } finally {
      setExporting(false);
      setExportFormat(null);
    }
  };

  const exportOptions = [
    {
      id: 'markdown',
      label: 'Markdown',
      description: 'Export as Markdown document with citations',
      icon: FileText,
      action: () => exportText('markdown'),
    },
    {
      id: 'text',
      label: 'Plain Text',
      description: 'Export as plain text file',
      icon: FileText,
      action: () => exportText('text'),
    },
    {
      id: 'json',
      label: 'JSON',
      description: 'Export structured data for backup or import',
      icon: FileJson,
      action: () => exportText('json'),
    },
    {
      id: 'png',
      label: 'PNG Image',
      description: 'Export as high-quality PNG image',
      icon: ImageIcon,
      action: () => exportImage('png'),
    },
    {
      id: 'jpg',
      label: 'JPG Image',
      description: 'Export as compressed JPG image',
      icon: ImageIcon,
      action: () => exportImage('jpg'),
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Export Mind Map
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
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Choose a format to export your mind map
          </p>

          <div className="space-y-3">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              const isExporting = exporting && exportFormat === option.id;

              return (
                <button
                  key={option.id}
                  onClick={option.action}
                  disabled={exporting}
                  className="w-full flex items-start gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-shrink-0">
                    <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {option.label}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {option.description}
                    </p>
                  </div>
                  {isExporting && (
                    <div className="flex-shrink-0">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {exporting && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                Exporting... Please wait
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
