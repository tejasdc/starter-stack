import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Starter Stack</h1>
        <p className="mt-3 text-lg text-[var(--text-secondary)]">
          Hono + React + TanStack + Tailwind v4 + BullMQ
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <a
            href="/api/health"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            API Health
          </a>
          <a
            href="https://github.com/your-org/starter-stack"
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold hover:border-[var(--border-medium)]"
          >
            Documentation
          </a>
        </div>
      </div>
    </div>
  );
}
