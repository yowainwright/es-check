import type { ReactNode } from "react";
import { useState } from "react";
import { Footer, DocsHeader, Sidebar } from "@/components";

interface DocsLayoutProps {
  children: ReactNode;
}

export function DocsLayout({ children }: DocsLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDrawerOpen(e.target.checked);
  };

  return (
    <section className="flex flex-col min-h-screen">
      <main className="drawer lg:drawer-open flex-1">
        <input
          id="docs-drawer"
          type="checkbox"
          className="drawer-toggle"
          checked={drawerOpen}
          onChange={handleDrawerChange}
        />
        <section className="drawer-content flex flex-col">
          <DocsHeader />
          <article className="flex-1">{children}</article>
        </section>
        <Sidebar />
      </main>
      <Footer />
    </section>
  );
}
