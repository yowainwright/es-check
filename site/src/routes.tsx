import { lazy, Suspense } from "react";
import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

const AppLayout = lazy(() =>
  import("./layouts/AppLayout").then((m) => ({ default: m.AppLayout })),
);
const HomePage = lazy(() =>
  import("./pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const CommunityPage = lazy(() =>
  import("./pages/CommunityPage").then((m) => ({ default: m.CommunityPage })),
);
const DocsPage = lazy(() =>
  import("./pages/DocsPage").then((m) => ({ default: m.DocsPage })),
);

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AppLayout>
        <HomePage />
      </AppLayout>
    </Suspense>
  ),
});

const communityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/community",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AppLayout>
        <CommunityPage />
      </AppLayout>
    </Suspense>
  ),
});

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs/$slug",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AppLayout>
        <DocsPage />
      </AppLayout>
    </Suspense>
  ),
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  communityRoute,
  docsRoute,
]);
