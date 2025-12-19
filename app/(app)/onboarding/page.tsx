"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const handleCreateFirstWorkspace = async (e: React.FormEvent) => {
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

      router.push("/dashboard");
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
    <div className="min-h-screen bg-background-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <h1 className="text-3xl font-bold text-foreground">Welcome to MindMap</h1>
          <p className="text-foreground-secondary mt-2">
            Let&apos;s get you set up in a few steps
          </p>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Great! You&apos;re all signed up.
                </h2>
                <p className="text-foreground-secondary">
                  Hi {user?.name || "there"}! We&apos;re excited to have you on board.
                </p>
              </div>
              <Button onClick={() => setStep(2)} className="w-full">
                Let&apos;s Get Started
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Create Your First Workspace
                </h2>
                <p className="text-foreground-secondary mb-4">
                  A workspace is where you&apos;ll organize your mind maps and collaborate with teammates.
                </p>
                <form onSubmit={handleCreateFirstWorkspace} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-error/10 border border-error text-error rounded-md text-sm">
                      {error}
                    </div>
                  )}
                  <Input
                    label="Workspace Name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g., My Projects, Team Brainstorm"
                    disabled={loading}
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setStep(1)}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={loading}
                      className="flex-1"
                    >
                      Create Workspace
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
