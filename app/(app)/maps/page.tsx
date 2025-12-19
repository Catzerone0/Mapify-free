"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Grid, List, Search, SlidersHorizontal } from "lucide-react";
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

export default function MyMapsPage() {
  const router = useRouter();
  const { isLoading } = useAuthStore();
  const { workspaces } = useWorkspaceStore();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<"recent" | "name" | "created">("recent");
  const [q, setQ] = useState("");
  const [workspaceId, setWorkspaceId] = useState<string | "all">("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maps, setMaps] = useState<MindMapListItem[]>([]);

  const fetchMaps = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const url = new URL("/api/maps", window.location.origin);
      url.searchParams.set("take", "50");
      url.searchParams.set("sort", sort);
      if (q.trim()) url.searchParams.set("q", q.trim());
      if (workspaceId !== "all") url.searchParams.set("workspaceId", workspaceId);

      const res = await fetch(url.toString(), {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.error || "Failed to load maps");
      }

      setMaps(data?.data?.mindMaps || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load maps");
    } finally {
      setLoading(false);
    }
  }, [q, sort, workspaceId]);

  useEffect(() => {
    if (isLoading) return;
    fetchMaps();
  }, [fetchMaps, isLoading]);

  const workspaceOptions = useMemo(() => {
    return [{ id: "all", name: "All workspaces" } as const].concat(
      workspaces.map((w) => ({ id: w.id, name: w.name }))
    );
  }, [workspaces]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">My Maps</h2>
          <p className="text-sm text-foreground-secondary">
            Search, sort, and open your mind maps.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setView(view === "grid" ? "list" : "grid")}
          >
            {view === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            {view === "grid" ? "List" : "Grid"}
          </Button>
          <Button onClick={() => router.push("/mindmap/create")}>Create</Button>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-foreground-secondary" />
            <h3 className="text-lg font-semibold">Filters</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <Search className="h-4 w-4 text-foreground-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name…"
                className="pl-9"
              />
            </div>

            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value as string)}
              className="h-9 px-3 border border-border rounded-md bg-background text-foreground"
            >
              {workspaceOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-9 px-3 border border-border rounded-md bg-background text-foreground"
            >
              <option value="recent">Recently updated</option>
              <option value="created">Date created</option>
              <option value="name">Name</option>
            </select>

            <div className="md:col-span-3">
              <Button variant="secondary" onClick={fetchMaps} disabled={loading}>
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mt-4 p-3 bg-error/10 border border-error text-error rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 text-sm text-foreground-secondary">Loading…</div>
      ) : maps.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="pt-6 text-center">
            <p className="text-foreground-secondary">No maps found.</p>
            <div className="mt-4">
              <Button onClick={() => router.push("/mindmap/create")}>Create your first map</Button>
            </div>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {maps.map((m) => (
            <button
              key={m.id}
              onClick={() => router.push(`/mindmap/editor?id=${m.id}`)}
              className="text-left p-4 rounded-md border border-border hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">{m.title}</div>
                  <div className="mt-1 text-xs text-foreground-secondary">
                    {m.nodeCount} nodes • {new Date(m.updatedAt).toLocaleString()}
                  </div>
                </div>
                {m.shared && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    shared
                  </span>
                )}
              </div>
              {m.description && (
                <div className="mt-3 text-sm text-foreground-secondary line-clamp-2">
                  {m.description}
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {maps.map((m) => (
            <button
              key={m.id}
              onClick={() => router.push(`/mindmap/editor?id=${m.id}`)}
              className="w-full text-left p-4 rounded-md border border-border hover:bg-accent transition-colors flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium text-foreground truncate">{m.title}</div>
                <div className="mt-1 text-xs text-foreground-secondary">
                  {m.nodeCount} nodes • {m.provider || "provider"} • Updated {new Date(m.updatedAt).toLocaleString()}
                </div>
              </div>
              <div className="text-xs text-foreground-secondary">
                {m.shared ? "Shared" : "Private"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
