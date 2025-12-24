'use client';

import React, { useState } from 'react';
import { Download, FileJson, FileText, Image as ImageIcon, X } from 'lucide-react';
import { toJpeg, toPng } from 'html-to-image';

interface ExportMenuProps {
  mindMapId: string;
  mindMapTitle: string;
  onClose: () => void;
}

export function ExportMenu({ mindMapId, mindMapTitle, onClose }: ExportMenuProps) {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<
    'markdown' | 'text' | 'json' | 'png' | 'jpg' | null
  >(null);

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
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/maps/${mindMapId}/export?format=${format}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const content = await response.text();
        const filename =
          response
            .headers
            .get('Content-Disposition')
            ?.split('filename=')[1]
            ?.replace(/"/g, '') || `mindmap.${format}`;
        const mimeType = response.headers.get('Content-Type') || 'text/plain';

        downloadFile(content, filename, mimeType);
      } else {
        alert('Failed to export mind map');
      }
    } catch {
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
      const flowElement = document.querySelector('.react-flow') as HTMLElement;

      if (!flowElement) {
        alert('Could not find mind map to export');
        return;
      }

      const dataUrl =
        format === 'png'
          ? await toPng(flowElement, { quality: 1, pixelRatio: 2 })
          : await toJpeg(flowElement, { quality: 0.95, pixelRatio: 2 });

      const link = document.createElement('a');
      link.download = `${mindMapTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
      link.href = dataUrl;
      link.click();
    } catch {
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-popover text-popover-foreground rounded-md shadow-elevation-3 border border-border max-w-2xl w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Download className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Export Mind Map</h2>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-foreground-secondary mb-6">Choose a format to export your mind map</p>

          <div className="space-y-3">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              const isExporting = exporting && exportFormat === option.id;

              return (
                <button
                  key={option.id}
                  onClick={option.action}
                  disabled={exporting}
                  className="w-full flex items-start gap-4 p-4 border border-border rounded-md hover:bg-accent hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-shrink-0">
                    <Icon className="w-6 h-6 text-foreground-secondary" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-foreground">{option.label}</h3>
                    <p className="text-sm text-foreground-secondary mt-1">{option.description}</p>
                  </div>
                  {isExporting && (
                    <div className="flex-shrink-0">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {exporting && (
            <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-md">
              <p className="text-sm text-primary text-center font-medium">Exporting… Please wait</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
