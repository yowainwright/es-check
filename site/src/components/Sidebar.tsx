import { Link, useLocation } from "@tanstack/react-router";
import {
  SIDEBAR,
  type SidebarItem,
  type SidebarSection,
} from "@/constants/sidebar";

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <div className="drawer-side z-40 md:border-r md:border-base-content/10">
      <label
        htmlFor="app-drawer"
        aria-label="close sidebar"
        className="drawer-overlay"
      />
      <aside className="bg-base-100 min-h-screen w-72 md:w-80 pt-4">
        <SidebarNav pathname={pathname} />
      </aside>
    </div>
  );
}

function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <ul className="menu w-full px-4 py-0 font-sans">
      {SIDEBAR.map((section) => (
        <SidebarSectionItem
          key={section.title}
          section={section}
          pathname={pathname}
        />
      ))}
    </ul>
  );
}

function SidebarSectionItem({
  section,
  pathname,
}: {
  section: SidebarSection;
  pathname: string;
}) {
  return (
    <li>
      <h2 className="menu-title flex items-center gap-4 px-1.5">
        {section.title}
      </h2>
      <ul>
        {section.items.map((item) => (
          <SidebarNavItem key={item.href} item={item} pathname={pathname} />
        ))}
      </ul>
    </li>
  );
}

function SidebarNavItem({
  item,
  pathname,
}: {
  item: SidebarItem;
  pathname: string;
}) {
  const isActive = pathname.endsWith(item.href.replace("/docs/", ""));
  const activeClass = isActive ? "text-primary bg-primary/5" : "";
  const badgeClass =
    item.label === "Improved" ? "badge-success" : "badge-primary";

  return (
    <li className="flex flex-col">
      <Link
        to={item.href}
        className={`hover:text-primary hover:bg-primary/5 transition flex ${activeClass}`}
      >
        {item.title}
        {item.label && (
          <div className={`badge badge-sm ${badgeClass}`}>{item.label}</div>
        )}
      </Link>
    </li>
  );
}
