"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-foreground">Contact & Feedback</h1>
      <p className="mt-2 text-foreground-secondary">
        Send feedback, report a bug, or request a feature.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <h2 className="text-lg font-semibold">Contact form</h2>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="p-4 rounded-md border border-success/30 bg-success/10 text-success">
              Thanks! Your message was captured. (Demo form — not sent.)
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground min-h-[140px]"
                  placeholder="Describe the issue or idea..."
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Submit
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
