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

  if (!isDocsPage) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="drawer lg:drawer-open flex-1">
        <input id="app-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          <div className="flex flex-1">
            <main className="flex-1 min-w-0">{children}</main>
            {rightSidebarContent && (
              <aside className="hidden xl:block w-64 shrink-0">
                <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
                  {rightSidebarContent}
                </div>
              </aside>
            )}
          </div>
        </div>
        <Sidebar />
      </div>
      <Footer />
    </div>
  );
}
