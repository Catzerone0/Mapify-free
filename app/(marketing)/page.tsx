"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Globe,
  Sparkles,
  Share2,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/lib/stores/auth";

const faqs = [
  {
    q: "Do I need my own OpenAI/Gemini key?",
    a: "Yes. Mapify stores your provider key securely and uses it to generate your maps.",
  },
  {
    q: "Can I share a mind map with someone who doesn’t have an account?",
    a: "Yes. You can generate a share link (optionally password protected).",
  },
  {
    q: "Is there a free tier?",
    a: "Yes. The free tier includes unlimited workspaces and manual editing. AI generation uses your own API key.",
  },
];

export default function MarketingHomePage() {
  const router = useRouter();
  const { isAuthenticated, setUser, setToken } = useAuthStore();
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const primaryCtaHref = useMemo(() => {
    return isAuthenticated() ? "/dashboard" : "/auth/signup";
  }, [isAuthenticated]);

  const primaryCtaLabel = isAuthenticated() ? "Go to dashboard" : "Sign up free";

  const handleDemo = async () => {
    setDemoError(null);
    setDemoLoading(true);

    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Failed to start demo");
      }

      const payload = data?.data;
      if (payload?.token && payload?.user) {
        localStorage.setItem("auth_token", payload.token);
        localStorage.setItem("auth_user", JSON.stringify(payload.user));
        setToken(payload.token);
        setUser(payload.user);
      }

      router.push("/dashboard");
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : "Failed to start demo");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-14 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm text-foreground-secondary">Turn any content into a mind map.</p>
            <h1 className="mt-3 text-4xl md:text-5xl font-semibold tracking-tight text-foreground">
              Mapify: generate, edit, and share mind maps in minutes
            </h1>
            <p className="mt-4 text-lg text-foreground-secondary max-w-xl">
              Paste text, a link, or a YouTube video. Mapify generates a clean, structured map you can
              refine and share.
            </p>

            {demoError && (
              <div className="mt-4 p-3 rounded-md border border-error bg-error/10 text-error text-sm">
                {demoError}
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href={primaryCtaHref}
                className="h-10 px-5 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {primaryCtaLabel} <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
              <Button
                variant="secondary"
                onClick={handleDemo}
                loading={demoLoading}
                disabled={demoLoading}
              >
                Try demo
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-foreground-secondary">
              {["Fast generation", "Your own API key", "Share links", "Works on mobile"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                title: "From text",
                desc: "Turn notes into a structured outline.",
                icon: Sparkles,
              },
              {
                title: "From websites",
                desc: "Summarize articles and docs.",
                icon: Globe,
              },
              {
                title: "Shareable",
                desc: "Send a link with optional password.",
                icon: Share2,
              },
              {
                title: "Secure",
                desc: "Keys are encrypted at rest.",
                icon: Shield,
              },
            ].map(({ title, desc, icon: Icon }) => (
              <Card key={title}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{title}</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground-secondary">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials / examples */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold text-foreground">How teams use Mapify</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "Project planning",
              desc: "Break down launches into milestones and owners.",
            },
            {
              title: "Studying",
              desc: "Turn lectures into a reviewable structure.",
            },
            {
              title: "Research",
              desc: "Summarize articles and keep citations in one place.",
            },
          ].map((t) => (
            <Card key={t.title}>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground">{t.title}</h3>
                <p className="mt-1 text-sm text-foreground-secondary">{t.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold text-foreground">Pricing</h2>
        <p className="mt-2 text-foreground-secondary">
          Mapify is free to use. AI generation uses your own provider key.
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Free</h3>
              <p className="text-sm text-foreground-secondary">$0 / month</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {[
                "Unlimited workspaces",
                "Unlimited manual edits",
                "Share links",
                "Templates gallery",
              ].map((x) => (
                <div key={x} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  <span>{x}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Bring-your-own-key AI</h3>
              <p className="text-sm text-foreground-secondary">Use OpenAI or Gemini</p>
            </CardHeader>
            <CardContent className="text-sm text-foreground-secondary">
              Your LLM provider bills you directly. Mapify stores your key encrypted and uses it only
              for your requests.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold text-foreground">FAQ</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((f) => (
            <Card key={f.q}>
              <CardContent className="pt-6">
                <div className="font-medium text-foreground">{f.q}</div>
                <div className="mt-2 text-sm text-foreground-secondary">{f.a}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-sm text-foreground-secondary">
          Need help? <Link href="/help" className="text-primary hover:underline">Visit Help</Link>.
        </div>
      </section>
    </div>
  );
}
