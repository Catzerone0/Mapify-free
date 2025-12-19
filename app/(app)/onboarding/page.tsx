"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { useAuthStore } from "@/lib/stores/auth";
import { useWorkspaceStore } from "@/lib/stores/workspace";

type Provider = "openai" | "gemini";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { addWorkspace, setCurrentWorkspace } = useWorkspaceStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [provider, setProvider] = useState<Provider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string | null>(null);

  const displayName = useMemo(() => user?.name || user?.email || "there", [user]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated()) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSaveApiKey = async () => {
    setError(null);
    if (!apiKey.trim()) {
      setStep(3);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/llm-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          provider,
          apiKey,
          label: "Onboarding",
          isDefault: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.error || "Failed to save key");
      }

      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save key");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!workspaceName.trim()) {
        throw new Error("Workspace name is required");
      }

      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: workspaceName }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || data?.error || "Failed to create workspace");
      }

      const workspace = data.data;
      addWorkspace(workspace);
      setCurrentWorkspace(workspace);
      localStorage.setItem("current_workspace_id", workspace.id);
      setCreatedWorkspaceId(workspace.id);
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center text-foreground-secondary">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated()) return null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <h1 className="text-3xl font-bold text-foreground">Welcome to Mapify</h1>
          <p className="text-foreground-secondary mt-2">
            Let&apos;s get you set up in 3–4 quick steps.
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error text-error rounded-md text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">You&apos;re in!</h2>
                <p className="text-foreground-secondary">
                  Hi {displayName}! We&apos;ll create a workspace, connect an AI provider, and generate
                  your first map.
                </p>
              </div>
              <Button onClick={() => setStep(2)} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Add an API key</h2>
                <p className="text-foreground-secondary">
                  Optional for now — you can also add this later in Settings.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as Provider)}
                    className="w-full h-9 px-3 border border-border rounded-md bg-background text-foreground"
                    disabled={loading}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </div>
                <Input
                  label="API key (optional)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-…"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={loading}>
                  Back
                </Button>
                <Button type="button" onClick={handleSaveApiKey} loading={loading} disabled={loading} className="flex-1">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Create your workspace</h2>
                <p className="text-foreground-secondary">
                  Workspaces keep your maps organized and ready for collaboration.
                </p>
              </div>

              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <Input
                  label="Workspace name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g., Personal, Study, Team"
                  disabled={loading}
                  required
                />

                <div className="flex gap-2">
                  <Button type="button" variant="secondary" onClick={() => setStep(2)} disabled={loading}>
                    Back
                  </Button>
                  <Button type="submit" loading={loading} disabled={loading} className="flex-1">
                    Create workspace
                  </Button>
                </div>
              </form>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">All set</h2>
                <p className="text-foreground-secondary">
                  Your workspace is ready. Next, generate your first mind map.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => {
                    if (createdWorkspaceId) {
                      router.push(`/mindmap/create?workspace=${createdWorkspaceId}`);
                    } else {
                      router.push("/dashboard");
                    }
                  }}
                  className="flex-1"
                >
                  Create first mind map
                </Button>
                <Button variant="secondary" onClick={() => router.push("/dashboard")} className="flex-1">
                  Go to dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
