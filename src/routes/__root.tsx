import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { translator } from "../shared/services/translationService";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="app-surface flex min-h-screen items-center justify-center px-4">
      <div className="modern-card page-enter w-full max-w-md p-8 text-center">
        <h1 className="text-7xl font-black text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-extrabold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link to="/" className="modern-button inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-sm hover:shadow-md">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="app-surface flex min-h-screen items-center justify-center px-4">
      <div className="modern-card page-enter w-full max-w-md p-8 text-center">
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end. You can try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="modern-button inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-sm hover:shadow-md">
            Try again
          </button>
          <a href="/" className="modern-button inline-flex items-center justify-center rounded-xl border border-input bg-background px-5 py-3 text-sm font-extrabold text-foreground shadow-sm hover:bg-accent">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Restocash — نظام إدارة المطاعم والمحاسبة ERP" },
      { name: "description", content: "نظام Restocash المتكامل لإدارة المطاعم، نقاط البيع، المخزون، الحسابات والخزائن." },
      { name: "author", content: "Restocash ERP" },
      { property: "og:title", content: "Restocash — نظام إدارة المطاعم والمحاسبة ERP" },
      { property: "og:description", content: "نظام Restocash المتكامل لإدارة المطاعم، نقاط البيع، المخزون، الحسابات والخزائن." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Restocash — نظام إدارة المطاعم والمحاسبة ERP" },
      { name: "twitter:description", content: "نظام Restocash المتكامل لإدارة المطاعم، نقاط البيع، المخزون، الحسابات والخزائن." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    try { translator.start(); } catch (e) { console.error("Failed to start translator:", e); }
  }, []);

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head><HeadContent /></head>
      <body className="app-surface" suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen page-enter">
            <Outlet />
          </div>
          <Toaster />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
