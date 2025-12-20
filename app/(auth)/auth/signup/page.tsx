"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card, CardContent, CardHeader } from "@/components/Card";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name || email.split("@")[0],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || data?.error || "Registration failed");
      }

      const url = data?.data?.verifyUrl as string | undefined;
      setVerifyUrl(url || null);
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
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-sm text-foreground-secondary mt-1">
            Get started with Mapify in a few minutes.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {verifyUrl ? (
            <div className="space-y-4">
              <div className="p-3 bg-success/10 border border-success/30 rounded-md text-sm">
                Account created. Please verify your email to continue.
              </div>
              <div className="text-sm text-foreground-secondary">
                Dev link: <Link href={verifyUrl} className="text-primary hover:underline">Verify email</Link>
              </div>
              <Button onClick={() => router.push("/auth/login")} className="w-full">
                Go to sign in
              </Button>
            </div>
          ) : (
            <>
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
                  label="Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  helperText="At least 8 characters"
                />

                <Input
                  label="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />

                <Button type="submit" loading={loading} disabled={loading} className="w-full">
                  Create account
                </Button>
              </form>

              <p className="text-sm text-foreground-secondary text-center">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
