"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export default function SharedWithMePage() {
  const router = useRouter();
  const [link, setLink] = useState("");

  const openLink = () => {
    const trimmed = link.trim();
    if (!trimmed) return;

    try {
      const url = new URL(trimmed);
      if (url.pathname.startsWith("/shared/")) {
        router.push(url.pathname);
      } else {
        router.push(trimmed);
      }
    } catch {
      router.push(`/shared/${trimmed}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold text-foreground">Shared with me</h2>
      <p className="mt-2 text-sm text-foreground-secondary">
        Open share links you&apos;ve been given. (User-to-user sharing lists are coming soon.)
      </p>

      <Card className="mt-6">
        <CardHeader>
          <h3 className="text-lg font-semibold">Open a share link</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            label="Share URL or token"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://…/shared/<token> or <token>"
          />
          <Button onClick={openLink}>Open</Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="pt-6 text-sm text-foreground-secondary">
          If you are looking for collaboration features like comments and presence indicators, those
          appear inside the editor when real-time collaboration is enabled.
        </CardContent>
      </Card>
    </div>
  );
}
