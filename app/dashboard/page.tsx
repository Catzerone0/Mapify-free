"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { useWorkspaceStore } from "@/lib/stores/workspace";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { workspaces, setWorkspaces, addWorkspace } = useWorkspaceStore();
  const [loading, setLoading] = useState(false);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState("");

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await fetch("/api/workspaces", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch workspaces");
      }

      const data = await response.json();
      setWorkspaces(data.data || []);
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    }
  }, [setWorkspaces]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    // Fetch workspaces
    fetchWorkspaces();
  }, [isAuthenticated, router, fetchWorkspaces]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!workspaceName.trim()) {
        throw new Error("Workspace name is required");
      }

      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: workspaceName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workspace");
      }

      const data = await response.json();
      addWorkspace(data.data);
      setWorkspaceName("");
      setShowNewWorkspace(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">MindMap</h1>
            <p className="text-sm text-foreground-secondary">
              Welcome, {user?.name || user?.email}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              localStorage.removeItem("auth_token");
              localStorage.removeItem("auth_user");
              useAuthStore.setState({
                user: null,
                token: null,
              });
              router.push("/auth/login");
            }}
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">Workspaces</h2>
          <Button onClick={() => setShowNewWorkspace(true)}>
            New Workspace
          </Button>
        </div>

        {showNewWorkspace && (
          <Card className="mb-6">
            <CardHeader>
              <h3 className="text-lg font-semibold text-foreground">
                Create New Workspace
              </h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                {error && (
                  <div className="p-3 bg-error/10 border border-error text-error rounded-md text-sm">
                    {error}
                  </div>
                )}
                <Input
                  label="Workspace Name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="My Awesome Workspace"
                  disabled={loading}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowNewWorkspace(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={loading} disabled={loading}>
                    Create
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {workspaces.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-foreground-secondary mb-4">
                No workspaces yet. Create one to get started!
              </p>
              <Button onClick={() => setShowNewWorkspace(true)}>
                Create First Workspace
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => (
              <Card
                key={workspace.id}
                className="cursor-pointer hover:shadow-elevation-2 transition-shadow"
                onClick={() => router.push(`/workspace/${workspace.id}`)}
              >
                <CardContent className="pt-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {workspace.name}
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    Created {new Date(workspace.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
