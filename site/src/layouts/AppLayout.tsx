import type { ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { Header, Footer, Sidebar } from "@/components";
import { LayoutProvider, useLayout } from "@/contexts";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <LayoutProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </LayoutProvider>
  );
}

function AppLayoutInner({ children }: AppLayoutProps) {
  const { rightSidebarContent } = useLayout();
  const location = useLocation();
  const isDocsPage = location.pathname.startsWith("/docs");

  const showContents = isDocsPage && rightSidebarContent;
  const contentClass = isDocsPage
    ? "grid w-full min-w-0 max-w-[1240px] grid-cols-1 gap-x-10 px-4 sm:px-6 md:px-10 xl:grid-cols-[minmax(0,1fr)_15rem]"
    : "flex min-w-0 flex-1";
  const mainClass = isDocsPage ? "mx-auto w-full min-w-0 max-w-[720px]" : "min-w-0 flex-1";

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 min-w-0">
        <Sidebar />
        <div className={contentClass}>
          <main className={mainClass}>{children}</main>
          {showContents && (
            <aside className="hidden min-w-0 pb-10 pt-12 xl:block">
              <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto">
                {rightSidebarContent}
              </div>
            </aside>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
