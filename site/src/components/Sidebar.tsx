import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  SIDEBAR,
  SITE_NAVIGATION,
  type SidebarItem,
  type SidebarSection,
} from "@/constants/sidebar";
import { useLayout } from "@/contexts";

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const isDocsPage = pathname.startsWith("/docs/");

  return (
    <>
      {isDocsPage && (
        <aside className="hidden lg:block w-64 shrink-0 border-r border-base-content/10">
          <nav
            aria-label="Documentation"
            className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto py-4"
          >
            <SidebarNav pathname={pathname} />
          </nav>
        </aside>
      )}
      <MobileMenu pathname={pathname} />
    </>
  );
}

function MobileMenu({ pathname }: { pathname: string }) {
  const { menuOpen, setMenuOpen } = useLayout();
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (menuOpen) dialog.current?.showModal();
    else dialog.current?.close();
  }, [menuOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [setMenuOpen]);

  return (
    <dialog
      ref={dialog}
      id="mobile-menu"
      className="modal place-items-start"
      aria-label="Site menu"
      onClose={() => setMenuOpen(false)}
    >
      <div className="modal-box m-0 h-dvh max-h-none w-80 max-w-[90vw] rounded-none px-0 py-4">
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="font-semibold">ES Check</span>
          <button
            type="button"
            className="btn btn-ghost btn-square"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>
        <nav
          aria-label="Mobile navigation"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setMenuOpen(false);
          }}
        >
          <ul className="menu w-full px-4 pb-4 border-b border-base-content/10 mb-4">
            {SITE_NAVIGATION.map((item) => (
              <SidebarNavItem key={item.href} item={item} pathname={pathname} />
            ))}
          </ul>
          <SidebarNav pathname={pathname} />
        </nav>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button aria-label="Dismiss menu" tabIndex={-1}>
          Close
        </button>
      </form>
    </dialog>
  );
}

function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <ul className="menu w-full px-4 py-0 font-sans">
      {SIDEBAR.map((section) => (
        <SidebarSectionItem key={section.title} section={section} pathname={pathname} />
      ))}
    </ul>
  );
}

function SidebarSectionItem({ section, pathname }: { section: SidebarSection; pathname: string }) {
  return (
    <li>
      <h2 className="menu-title flex items-center gap-4 px-1.5">{section.title}</h2>
      <ul>
        {section.items.map((item) => (
          <SidebarNavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </ul>
    </li>
  );
}

function SidebarNavItem({ item, pathname }: { item: SidebarItem; pathname: string }) {
  const isRelease = item.href === "/release" && pathname.startsWith("/release");
  const isActive = pathname === item.href || isRelease;
  const activeClass = isActive ? "text-primary bg-primary/5" : "";

  return (
    <li className="flex flex-col">
      <Link
        to={item.href}
        aria-current={isActive ? "page" : undefined}
        className={`hover:text-primary hover:bg-primary/5 transition flex ${activeClass}`}
      >
        {item.title}
      </Link>
    </li>
  );
}
