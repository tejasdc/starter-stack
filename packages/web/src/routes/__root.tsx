import { Outlet, createRootRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

function shouldRetry(err: unknown) {
  const status =
    typeof err === "object" && err !== null && "status" in err ? (err as any).status : null;
  if (typeof status === "number" && status >= 400 && status < 500) return false;
  return true;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, err) => (shouldRetry(err) ? failureCount < 2 : false),
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});

function RootError(props: { error: unknown }) {
  const msg = props.error instanceof Error ? props.error.message : String(props.error);
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 font-mono text-xs text-[var(--text-secondary)]">{msg}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm font-semibold hover:border-[var(--border-medium)]"
        >
          Reload
        </button>
      </div>
    </div>
  );
}

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-full">
        <Outlet />
      </div>
      <Toaster theme="dark" position="bottom-right" />
    </QueryClientProvider>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: RootError,
});
