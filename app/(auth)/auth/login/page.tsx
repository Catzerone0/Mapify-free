"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { useAuthStore } from "@/lib/stores/auth";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = useMemo(() => searchParams.get("from") || "/dashboard", [searchParams]);

  const { setUser, setToken, setLoading: setAuthLoading } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || data?.error || "Login failed");
      }

      const { token, user } = data.data;
      setToken(token);
      setUser(user);
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
      setAuthLoading(false);

      router.push(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-foreground">Sign In</h1>
          <p className="text-sm text-foreground-secondary mt-1">
            Welcome back — continue where you left off.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-error/10 border border-error text-error rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2">
            <Button type="button" variant="outline" disabled>
              Continue with Google (coming soon)
            </Button>
            <Button type="button" variant="outline" disabled>
              Continue with GitHub (coming soon)
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-foreground-secondary">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-foreground-secondary select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4"
                />
                Remember me
              </label>
              <Link href="/auth/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} disabled={loading} className="w-full">
              Sign In
            </Button>
          </form>

          <p className="text-sm text-foreground-secondary text-center">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
