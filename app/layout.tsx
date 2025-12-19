import type { Metadata } from "next";
import { Providers } from "@/lib/providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mapify",
    template: "%s | Mapify",
  },
  description: "Mapify helps you generate, edit, and share mind maps from any content.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased transition-colors duration-150 ease-out"
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <Providers>{children}</Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
