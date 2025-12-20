"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/lib/stores/auth";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { setToken, setUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError("Missing verification token");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error?.message || data?.error || "Verification failed");
        }

        const payload = data?.data;
        if (payload?.token && payload?.user) {
          localStorage.setItem("auth_token", payload.token);
          localStorage.setItem("auth_user", JSON.stringify(payload.user));
          setToken(payload.token);
          setUser(payload.user);
        }

        router.push("/onboarding");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Verification failed");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router, setToken, setUser, token]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
          <p className="text-sm text-foreground-secondary mt-1">{loading ? "Verifying…" : ""}</p>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="space-y-4">
              <div className="p-3 bg-error/10 border border-error text-error rounded-md text-sm">
                {error}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => router.push("/auth/signup")} className="flex-1">
                  Back to sign up
                </Button>
                <Link
                  href="/help"
                  className="h-9 px-4 inline-flex items-center rounded-md border border-border hover:bg-accent"
                >
                  Help
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-sm text-foreground-secondary">
              If everything looks good, you&apos;ll be redirected automatically.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center text-foreground-secondary">
          Loading…
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
