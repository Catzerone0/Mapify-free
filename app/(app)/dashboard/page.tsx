"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Sparkles, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useAuthStore } from "@/lib/stores/auth";
import { useWorkspaceStore } from "@/lib/stores/workspace";

type MindMapListItem = {
  id: string;
  title: string;
  description: string | null;
  provider: string | null;
  complexity: string | null;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  shared: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading } = useAuthStore();
  const { currentWorkspace, workspaces } = useWorkspaceStore();

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentMaps, setRecentMaps] = useState<MindMapListItem[]>([]);

  const activeWorkspaceId = useMemo(
    () => currentWorkspace?.id || (workspaces[0] ? workspaces[0].id : null),
    [currentWorkspace?.id, workspaces]
  );

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const url = new URL("/api/maps", window.location.origin);
      url.searchParams.set("take", "8");
      if (query.trim()) url.searchParams.set("q", query.trim());

      const res = await fetch(url.toString(), {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.error || "Failed to load");
      }

      setRecentMaps(data?.data?.mindMaps || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (isLoading) return;
    fetchRecent();
  }, [fetchRecent, isLoading]);

  const handleCreate = () => {
    if (activeWorkspaceId) {
      router.push(`/mindmap/create?workspace=${activeWorkspaceId}`);
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
          <p className="text-sm text-foreground-secondary">
            Recent work and quick actions.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Quick create
          </Button>
          <Link
            href="/templates"
            className="h-9 px-4 inline-flex items-center rounded-md border border-border hover:bg-accent"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Templates
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Recent mind maps</h3>
              <Link href="/maps" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 relative">
              <Search className="h-4 w-4 text-foreground-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search maps by title…"
                className="pl-9"
              />
              <div className="mt-2">
                <Button variant="secondary" onClick={fetchRecent} disabled={loading}>
                  Search
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-error/10 border border-error text-error rounded-md text-sm">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-sm text-foreground-secondary">Loading…</div>
            ) : recentMaps.length === 0 ? (
              <div className="text-sm text-foreground-secondary">
                No maps yet. Click “Quick create” to generate your first mind map.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recentMaps.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => router.push(`/mindmap/editor?id=${m.id}`)}
                    className="text-left p-4 rounded-md border border-border hover:bg-accent transition-colors"
                  >
                    <div className="font-medium text-foreground truncate">{m.title}</div>
                    <div className="mt-1 text-xs text-foreground-secondary">
                      {m.nodeCount} nodes • {m.provider || "provider"}
                      {m.shared ? " • shared" : ""}
                    </div>
                    {m.description && (
                      <div className="mt-2 text-sm text-foreground-secondary line-clamp-2">
                        {m.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Usage stats</h3>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-foreground-secondary">Maps shown</span>
              <span className="font-medium">{recentMaps.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-secondary">Nodes shown</span>
              <span className="font-medium">
                {recentMaps.reduce((sum, m) => sum + (m.nodeCount || 0), 0)}
              </span>
            </div>
            <div className="text-xs text-foreground-secondary">
              Stats are approximate and based on your recent maps.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-foreground">Workspaces</h3>
        <p className="text-sm text-foreground-secondary">Switch context and manage maps.</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-sm text-foreground-secondary">
                No workspaces yet. Complete onboarding to create your first one.
              </CardContent>
            </Card>
          ) : (
            workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => router.push(`/workspace/${ws.id}`)}
                className="text-left p-4 rounded-md border border-border hover:bg-accent transition-colors"
              >
                <div className="font-medium text-foreground">{ws.name}</div>
                <div className="mt-1 text-xs text-foreground-secondary">
                  Open workspace
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
