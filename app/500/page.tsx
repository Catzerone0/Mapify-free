import Link from "next/link";

export default function ServerErrorPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl font-semibold text-foreground">500</div>
        <h1 className="mt-3 text-xl font-semibold text-foreground">Server error</h1>
        <p className="mt-2 text-foreground-secondary">
          Something went wrong on our side.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link
            href="/"
            className="px-4 h-9 inline-flex items-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Home
          </Link>
          <Link
            href="/help"
            className="px-4 h-9 inline-flex items-center rounded-md border border-border hover:bg-accent"
          >
            Help
          </Link>
        </div>
      </div>
    </div>
  );
}
