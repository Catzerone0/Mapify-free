"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent: boolean; resetUrl?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.error || "Failed to request reset");
      }
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="text-sm text-foreground-secondary mt-1">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="p-3 bg-success/10 border border-success/30 text-foreground rounded-md text-sm">
                If an account exists, a reset link has been created.
              </div>

              {result.resetUrl && (
                <div className="text-sm text-foreground-secondary">
                  Dev link: <Link href={result.resetUrl} className="text-primary hover:underline">open reset page</Link>.
                </div>
              )}

              <Link
                href="/auth/login"
                className="h-9 px-4 inline-flex items-center rounded-md border border-border hover:bg-accent"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-error/10 border border-error text-error rounded-md text-sm">
                  {error}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />

              <Button type="submit" loading={loading} disabled={loading} className="w-full">
                Send reset link
              </Button>

              <div className="text-sm text-foreground-secondary text-center">
                Remembered your password?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
