import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "Authentication",
    template: "%s | Mapify",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold text-foreground">
            Mapify
          </Link>
          <Link href="/help" className="text-sm text-foreground-secondary hover:text-foreground">
            Help
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
