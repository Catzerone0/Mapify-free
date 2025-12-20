"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

type SharedNode = {
  id: string;
  parentId: string | null;
  title: string | null;
  content: string;
  level: number;
  order: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string | null;
  shape: string;
  isCollapsed: boolean;
  children: SharedNode[];
};

export default function SharedMindMapPage() {
  const params = useParams();
  const token = (params?.token as string) || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [mindMap, setMindMap] = useState<{ id: string; title: string; rootNodes: SharedNode[] } | null>(null);

  const fetchShared = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(`/api/shared/${token}`, window.location.origin);
      if (password.trim()) {
        url.searchParams.set("password", password.trim());
      }

      const res = await fetch(url.toString(), { method: "GET" });
      const data = await res.json();

      if (!res.ok) {
        const requires = res.status === 401 && data?.data?.requiresPassword;
        setRequiresPassword(!!requires);
        throw new Error(data?.error?.message || data?.message || data?.error || "Failed to load shared map");
      }

      const payload = data?.data;
      if (payload?.requiresPassword) {
        setRequiresPassword(true);
        setMindMap(null);
        return;
      }

      setRequiresPassword(false);
      setMindMap(payload?.mindMap || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load shared map");
    } finally {
      setLoading(false);
    }
  }, [password, token]);

  useEffect(() => {
    if (!token) return;
    fetchShared();
  }, [fetchShared, token]);

  const { nodes, edges } = useMemo(() => {
    if (!mindMap) return { nodes: [] as Node[], edges: [] as Edge[] };

    const outNodes: Node[] = [];
    const outEdges: Edge[] = [];

    const walk = (node: SharedNode) => {
      outNodes.push({
        id: node.id,
        position: { x: node.x, y: node.y },
        data: { label: node.title || "Untitled" },
        style: {
          width: node.width || 200,
          height: node.height || 80,
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          background: "var(--color-card)",
          color: "var(--color-foreground)",
          padding: 10,
          boxShadow: "var(--shadow-elevation-1)",
        },
      });

      for (const child of node.children || []) {
        outEdges.push({
          id: `${node.id}-${child.id}`,
          source: node.id,
          target: child.id,
          type: "smoothstep",
          style: { stroke: "var(--color-border)", strokeWidth: 2 },
        });
        walk(child);
      }
    };

    for (const root of mindMap.rootNodes || []) {
      walk(root);
    }

    return { nodes: outNodes, edges: outEdges };
  }, [mindMap]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {mindMap?.title || "Shared mind map"}
          </h1>
          <p className="text-sm text-foreground-secondary">
            Viewing a shared map. To create your own, <Link href="/auth/signup" className="text-primary hover:underline">sign up</Link>.
          </p>
        </div>
      </div>

      {loading && (
        <div className="mt-8 text-foreground-secondary">Loading…</div>
      )}

      {!loading && error && (
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-error font-medium">Unable to load shared map</div>
            <div className="mt-2 text-sm text-foreground-secondary">{error}</div>
            <div className="mt-4 flex gap-2">
              <Button onClick={fetchShared}>Retry</Button>
              <Link
                href="/"
                className="h-9 px-4 inline-flex items-center rounded-md border border-border hover:bg-accent"
              >
                Home
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && requiresPassword && (
        <Card className="mt-8 max-w-lg">
          <CardHeader>
            <h2 className="text-lg font-semibold">Password required</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              label="Share link password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={fetchShared} className="w-full">
              Unlock
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && mindMap && (
        <div className="mt-8 border border-border rounded-md overflow-hidden bg-background" style={{ height: 640 }}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background gap={20} color="var(--color-border)" />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      )}

      {!loading && mindMap && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-foreground">Outline</h2>
          <div className="mt-2 text-sm text-foreground-secondary">
            <Tree nodes={mindMap.rootNodes} />
          </div>
        </div>
      )}
    </div>
  );
}

function Tree({ nodes }: { nodes: SharedNode[] }) {
  return (
    <ul className="space-y-2">
      {nodes.map((n) => (
        <li key={n.id}>
          <div className="font-medium text-foreground">{n.title || "Untitled"}</div>
          {n.children?.length ? (
            <div className="pl-4 mt-1">
              <Tree nodes={n.children} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
