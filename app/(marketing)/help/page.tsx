import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/Card";

const faq = [
  {
    q: "How do I generate my first mind map?",
    a: "Create a workspace, add an API key in Settings, then click Quick create or Create Mind Map from a workspace.",
  },
  {
    q: "Where do I add my OpenAI/Gemini key?",
    a: "Go to Settings → API Keys and add a provider key.",
  },
  {
    q: "How do share links work?",
    a: "Open a map, click Share, and create a link. You can set a password and expiration.",
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-semibold text-foreground">Help & Documentation</h1>
      <p className="mt-2 text-foreground-secondary max-w-2xl">
        Quick start guides, troubleshooting tips, and commonly asked questions.
      </p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Quick start</h2>
          </CardHeader>
          <CardContent className="text-sm text-foreground-secondary space-y-2">
            <ol className="list-decimal pl-4 space-y-2">
              <li>Create an account (or use the demo).</li>
              <li>Create a workspace.</li>
              <li>Add an API key in Settings → API Keys.</li>
              <li>Generate a map from text, a link, or YouTube.</li>
              <li>Share with a link.</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="text-lg font-semibold">FAQ</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {faq.map((item) => (
              <div key={item.q}>
                <div className="font-medium text-foreground">{item.q}</div>
                <div className="mt-1 text-sm text-foreground-secondary">{item.a}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 text-sm text-foreground-secondary">
        Still stuck? <Link href="/contact" className="text-primary hover:underline">Contact support</Link>.
      </div>
    </div>
  );
}
