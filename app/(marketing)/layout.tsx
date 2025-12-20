import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const metadata: Metadata = {
  title: {
    default: "Mapify",
    template: "%s | Mapify",
  },
  description: "Mapify helps you turn any topic into a clear, shareable mind map.",
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold text-foreground">
              Mapify
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/help" className="text-foreground-secondary hover:text-foreground">
                Help
              </Link>
              <Link
                href="/contact"
                className="text-foreground-secondary hover:text-foreground"
              >
                Contact
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth/login"
              className="text-sm px-3 py-1.5 rounded-md border border-border hover:bg-accent"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10 text-sm text-foreground-secondary flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Mapify. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/help" className="hover:text-foreground">
              FAQ
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
