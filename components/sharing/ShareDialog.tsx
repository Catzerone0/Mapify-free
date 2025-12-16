'use client';

import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/maps/${mindMapId}/share`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setShareLinks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching share links:', error);
    }
  }, [mindMapId]);

  React.useEffect(() => {
    fetchShareLinks();
  }, [fetchShareLinks]);

  const createShareLink = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/maps/${mindMapId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
    } catch (error) {
      console.error('Error creating share link:', error);
      setError('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const deleteShareLink = async (linkId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/maps/${mindMapId}/share?linkId=${linkId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setShareLinks(shareLinks.filter((link) => link.id !== linkId));
    } catch (error) {
      console.error('Error deleting share link:', error);
    }
  };

  const copyToClipboard = async (url: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(linkId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Share2 className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Share Mind Map
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Create new link */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Create Share Link
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Access Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'viewer' | 'editor' | 'owner')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="viewer">Viewer (read-only)</option>
                <option value="editor">Editor (can edit)</option>
                <option value="owner">Owner (full access)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password (optional)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave empty for no password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expires At (optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={createShareLink}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Link'}
            </button>
          </div>

          {/* Existing links */}
          {shareLinks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Active Share Links
              </h3>

              {shareLinks.map((link) => (
                <div
                  key={link.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role: <span className="capitalize">{link.role}</span>
                    </span>
                    <button
                      onClick={() => deleteShareLink(link.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>

                  {link.hasPassword && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      🔒 Password protected
                    </div>
                  )}

                  {link.expiresAt && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ⏰ Expires: {new Date(link.expiresAt).toLocaleString()}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={link.url}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => copyToClipboard(link.url, link.id)}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300"
                    >
                      {copiedLink === link.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
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
