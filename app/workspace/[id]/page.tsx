'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth";
import { Button } from "@/components/Button";
import { Card, CardContent } from "@/components/Card";
import { ArrowLeft, Settings, Users, FileText } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  mindMaps: Array<{
    id: string;
    title: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string>("");

  // Handle params being a promise in Next.js 13+
  useEffect(() => {
    const getWorkspaceId = async () => {
      try {
        if (params && typeof params === 'object' && 'id' in params) {
          const id = params.id;
          if (typeof id === 'string') {
            setWorkspaceId(id);
            return id;
          }
        }
        setError("Invalid workspace ID");
        setLoading(false);
        return null;
      } catch {
        setError("Failed to load workspace");
        setLoading(false);
        return null;
      }
    };

    getWorkspaceId();
  }, [params]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!workspaceId || !isAuthenticated()) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/workspaces/${workspaceId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Workspace not found");
          }
          throw new Error("Failed to fetch workspace");
        }

        const data = await response.json();
        setWorkspace(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch workspace");
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId && workspaceId.length > 0) {
      fetchWorkspace();
    }
  }, [workspaceId, isAuthenticated]);

  const handleGoBack = () => {
    router.push("/dashboard");
  };

  const handleCreateMindMap = () => {
    router.push(`/mindmap/create?workspace=${workspaceId}`);
  };

  if (!isAuthenticated()) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-foreground-secondary">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-error text-xl mb-4">Workspace Not Found</div>
          <p className="text-foreground-secondary mb-4">
            {error || "The workspace you're looking for doesn't exist or you don't have access to it."}
          </p>
          <Button onClick={handleGoBack}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const getCurrentUserId = () => {
    try {
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        return user.id;
      }
    } catch {
      // Failed to parse stored user
    }
    return null;
  };

  const currentUserId = getCurrentUserId();
  const isOwner = currentUserId && workspace.members.some(member => member.user.id === currentUserId && member.role === "owner");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{workspace.name}</h1>
              <p className="text-sm text-foreground-secondary">
                Created {new Date(workspace.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isOwner && (
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">Mind Maps</h2>
          <Button onClick={handleCreateMindMap}>
            Create Mind Map
          </Button>
        </div>

        {/* Members Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 mr-2 text-foreground-secondary" />
            <h3 className="text-lg font-medium text-foreground">Members</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspace.members.map((member) => (
              <Card key={member.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-sm text-foreground-secondary">
                        {member.user.email}
                      </p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">
                      {member.role}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mind Maps Section */}
        <div>
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 mr-2 text-foreground-secondary" />
            <h3 className="text-lg font-medium text-foreground">Mind Maps</h3>
          </div>

          {workspace.mindMaps.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-foreground-secondary mb-4" />
                <p className="text-foreground-secondary mb-4">
                  No mind maps yet. Create your first one to get started!
                </p>
                <Button onClick={handleCreateMindMap}>
                  Create First Mind Map
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workspace.mindMaps.map((mindMap) => (
                <Card
                  key={mindMap.id}
                  className="cursor-pointer hover:shadow-elevation-2 transition-shadow"
                  onClick={() => router.push(`/mindmap/editor?id=${mindMap.id}`)}
                >
                  <CardContent className="pt-4">
                    <h4 className="text-lg font-semibold text-foreground mb-2">
                      {mindMap.title}
                    </h4>
                    {mindMap.description && (
                      <p className="text-sm text-foreground-secondary mb-2">
                        {mindMap.description}
                      </p>
                    )}
                    <p className="text-xs text-foreground-secondary">
                      Created {new Date(mindMap.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}