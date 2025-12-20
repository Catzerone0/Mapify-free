"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useWorkspaceStore } from "@/lib/stores/workspace";

type Template = {
  name: string;
  description: string;
  prompt: string;
  category: string;
  complexity: string;
  language?: string;
  icon?: string;
};

export default function TemplatesPage() {
  const router = useRouter();
  const { currentWorkspace, workspaces } = useWorkspaceStore();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/templates", window.location.origin);
      if (category !== "all") url.searchParams.set("category", category);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok && data.success) {
        setTemplates(data.data.templates || []);
        setCategories(["all", ...(data.data.categories || [])]);
      }
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filtered = useMemo(() => {
    if (!query.trim()) return templates;
    const q = query.toLowerCase();
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }, [query, templates]);

  const workspaceId =
    currentWorkspace?.id ||
    (typeof window !== "undefined" ? localStorage.getItem("current_workspace_id") : null) ||
    (workspaces[0]?.id ?? null);

  const handleUse = (t: Template) => {
    if (!workspaceId) {
      router.push("/onboarding");
      return;
    }

    localStorage.setItem(
      "mapify_template",
      JSON.stringify({
        name: t.name,
        prompt: t.prompt,
        complexity: t.complexity,
      })
    );

    router.push(`/mindmap/create?workspace=${workspaceId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Templates</h2>
          <p className="text-sm text-foreground-secondary">
            Start from a proven structure.
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-semibold">Browse</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative md:col-span-2">
              <Search className="h-4 w-4 text-foreground-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search templates…"
                className="pl-9"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-9 px-3 border border-border rounded-md bg-background text-foreground capitalize"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="mt-6 text-sm text-foreground-secondary">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="pt-6 text-center text-foreground-secondary">
            No templates found.
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <Card key={t.name}>
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">
                      {t.icon ? `${t.icon} ` : ""}
                      {t.name}
                    </div>
                    <div className="mt-1 text-sm text-foreground-secondary line-clamp-2">
                      {t.description}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                    {t.category}
                  </span>
                </div>

                <div className="text-xs text-foreground-secondary">
                  Complexity: <span className="capitalize">{t.complexity}</span>
                </div>

                <div className="pt-2">
                  <Button onClick={() => handleUse(t)} className="w-full">
                    Use template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-10 text-sm text-foreground-secondary">
        Tip: You can also open the template gallery from inside the editor.
      </div>
    </div>
  );
}
