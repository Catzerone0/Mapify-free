"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/Button";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/Card";
import { Input } from "@/components/Input";

interface ProviderKey {
  id: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [providerKeys, setProviderKeys] = useState<ProviderKey[]>([]);
  const [error, setError] = useState("");
  const [newKey, setNewKey] = useState({
    provider: "openai",
    apiKey: "",
  });
  const [addingKey, setAddingKey] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    fetchProviderKeys();
  }, [isAuthenticated, router]);

  const fetchProviderKeys = async () => {
    try {
      const response = await fetch("/api/llm-keys", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch provider keys");
      }

      const data = await response.json();
      setProviderKeys(data.data || []);
    } catch (err) {
      console.error("Failed to fetch provider keys:", err);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAddingKey(true);

    try {
      if (!newKey.apiKey.trim()) {
        throw new Error("API key is required");
      }

      const response = await fetch("/api/llm-keys", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: newKey.provider,
          apiKey: newKey.apiKey,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Failed to add API key");
      }

      const data = await response.json();
      setProviderKeys([...providerKeys, data.data]);
      setNewKey({ provider: "openai", apiKey: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setAddingKey(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) {
      return;
    }

    try {
      const response = await fetch(`/api/llm-keys/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete API key");
      }

      setProviderKeys(providerKeys.filter((key) => key.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-secondary">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          </div>
          <Button
            variant="secondary"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* LLM API Keys Section */}
        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold text-foreground">
              LLM API Keys
            </h2>
            <p className="text-sm text-foreground-secondary mt-1">
              Add and manage your LLM provider API keys. Keys are encrypted and stored securely.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 bg-error/10 border border-error text-error rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Add New Key Form */}
            <div className="border-t border-border pt-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Add New API Key
              </h3>
              <form onSubmit={handleAddKey} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Provider
                    </label>
                    <select
                      value={newKey.provider}
                      onChange={(e) =>
                        setNewKey({ ...newKey, provider: e.target.value })
                      }
                      disabled={addingKey}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                    </select>
                  </div>
                  <Input
                    type="password"
                    label="API Key"
                    value={newKey.apiKey}
                    onChange={(e) =>
                      setNewKey({ ...newKey, apiKey: e.target.value })
                    }
                    placeholder="sk-..."
                    disabled={addingKey}
                  />
                </div>
                <Button
                  type="submit"
                  loading={addingKey}
                  disabled={addingKey}
                >
                  Add API Key
                </Button>
              </form>
            </div>

            {/* Existing Keys List */}
            {providerKeys.length > 0 && (
              <div className="border-t border-border pt-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Your API Keys
                </h3>
                <div className="space-y-3">
                  {providerKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-3 bg-background-secondary rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium text-foreground capitalize">
                          {key.provider}
                        </p>
                        <p className="text-sm text-foreground-secondary">
                          Added {new Date(key.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteKey(key.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {providerKeys.length === 0 && (
              <div className="text-center py-8">
                <p className="text-foreground-secondary">
                  No API keys added yet. Add one to get started.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-foreground">
              Account Settings
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-foreground-secondary">Email</p>
                <p className="font-medium text-foreground">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-secondary">Name</p>
                <p className="font-medium text-foreground">
                  {user?.name || "Not set"}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              onClick={() => {
                localStorage.removeItem("auth_token");
                localStorage.removeItem("auth_user");
                useAuthStore.setState({ user: null, token: null });
                router.push("/auth/login");
              }}
            >
              Sign Out
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
