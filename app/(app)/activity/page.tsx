"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";

type ActivityItem = {
  id: string;
  action: string;
  createdAt: string;
  mindMapId?: string | null;
  workspaceId?: string | null;
};

export default function ActivityPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ActivityItem[]>([]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/activity", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setItems(data.data?.items || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Activity</h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            A timeline of recent actions.
          </p>
        </div>
        <Button variant="secondary" onClick={fetchActivity} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent events</h3>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-foreground-secondary">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-foreground-secondary">
              No activity yet. Generate or edit a map to see events here.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{i.action}</div>
                    <div className="text-xs text-foreground-secondary">
                      {new Date(i.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <h3 className="text-lg font-semibold">Notification preferences</h3>
        </CardHeader>
        <CardContent className="text-sm text-foreground-secondary">
          Configure notification preferences in Settings → Notifications.
        </CardContent>
      </Card>
    </div>
  );
}
