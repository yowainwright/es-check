import { lazy, Suspense } from "react";
import { createRootRoute, createRoute, Outlet, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

const AppLayout = lazy(() => import("./layouts/AppLayout").then((m) => ({ default: m.AppLayout })));
const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const CommunityPage = lazy(() =>
  import("./pages/CommunityPage").then((m) => ({ default: m.CommunityPage })),
);
const DocsPage = lazy(() => import("./pages/DocsPage").then((m) => ({ default: m.DocsPage })));
const ReleasePage = lazy(() =>
  import("./pages/ReleasePage").then((m) => ({ default: m.ReleasePage })),
);
const ReleasesPage = lazy(() =>
  import("./pages/ReleasePage").then((m) => ({ default: m.ReleasesPage })),
);

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: redirectToGettingStarted,
});

const docsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
  beforeLoad: redirectToGettingStarted,
});

const heroRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hero",
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
  beforeLoad: ({ params }) => {
    const isOldGuide = ["how-to-contribute", "having-an-issue"].includes(params.slug);
    if (isOldGuide) {
      throw redirect({
        to: "/docs/$slug",
        params: { slug: "contributing-guideline" },
        replace: true,
      });
    }
  },
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AppLayout>
        <DocsPage />
      </AppLayout>
    </Suspense>
  ),
});

const releaseRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/release/$version",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AppLayout>
        <ReleasePage />
      </AppLayout>
    </Suspense>
  ),
});

const releasesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/release",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AppLayout>
        <ReleasesPage />
      </AppLayout>
    </Suspense>
  ),
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  heroRoute,
  communityRoute,
  docsIndexRoute,
  docsRoute,
  releaseRoute,
  releasesRoute,
]);

function redirectToGettingStarted() {
  throw redirect({ to: "/docs/$slug", params: { slug: "gettingstarted" }, replace: true });
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}
