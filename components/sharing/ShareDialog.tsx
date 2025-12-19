'use client';

import React, { useState } from 'react';
import { Check, Copy, Share2, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

interface ShareDialogProps {
  mindMapId: string;
  onClose: () => void;
}

interface ShareLink {
  id: string;
  token: string;
  role: string;
  expiresAt: Date | null;
  hasPassword: boolean;
  url: string;
}

export function ShareDialog({ mindMapId, onClose }: ShareDialogProps) {
  const [role, setRole] = useState<'viewer' | 'editor' | 'owner'>('viewer');
  const [password, setPassword] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchShareLinks = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/maps/${mindMapId}/share`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      if (data.success) {
        setShareLinks(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching share links:', err);
    }
  }, [mindMapId]);

  React.useEffect(() => {
    fetchShareLinks();
  }, [fetchShareLinks]);

  const createShareLink = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/maps/${mindMapId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          role,
          password: password || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShareLinks([...shareLinks, data.data]);
        setPassword('');
        setExpiresAt('');
      } else {
        setError(data.message || 'Failed to create share link');
      }
    } catch (err) {
      console.error('Error creating share link:', err);
      setError('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const deleteShareLink = async (linkId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/maps/${mindMapId}/share?linkId=${linkId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      setShareLinks(shareLinks.filter((link) => link.id !== linkId));
    } catch (err) {
      console.error('Error deleting share link:', err);
    }
  };

  const copyToClipboard = async (url: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(linkId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-popover text-popover-foreground rounded-md shadow-elevation-3 border border-border max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-semibold">Share Mind Map</h2>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-secondary hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Create Share Link</h3>

            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-2">
                Access Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'viewer' | 'editor' | 'owner')}
                className="w-full h-9 px-3 border border-border rounded-md bg-input text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
              >
                <option value="viewer">Viewer (read-only)</option>
                <option value="editor">Editor (can edit)</option>
                <option value="owner">Owner (full access)</option>
              </select>
            </div>

            <Input
              label="Password (optional)"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave empty for no password"
            />

            <Input
              label="Expires At (optional)"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />

            {error && (
              <div className="text-error text-sm bg-error/10 border border-error/30 rounded-md p-3">
                {error}
              </div>
            )}

            <Button onClick={createShareLink} disabled={loading} className="w-full">
              {loading ? 'Creating…' : 'Create Link'}
            </Button>
          </div>

          {shareLinks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Active Share Links</h3>

              {shareLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-4 border border-border bg-secondary rounded-md space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground-secondary">
                      Role: <span className="capitalize text-foreground">{link.role}</span>
                    </span>
                    <button
                      onClick={() => deleteShareLink(link.id)}
                      className="text-error hover:text-error/80 text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>

                  {link.hasPassword && (
                    <div className="text-small text-foreground-secondary">🔒 Password protected</div>
                  )}

                  {link.expiresAt && (
                    <div className="text-small text-foreground-secondary">
                      ⏰ Expires: {new Date(link.expiresAt).toLocaleString()}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={link.url}
                      readOnly
                      className="flex-1 h-9 px-3 text-sm border border-border rounded-md bg-input text-foreground"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(link.url, link.id)}
                      aria-label="Copy"
                    >
                      {copiedLink === link.id ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
