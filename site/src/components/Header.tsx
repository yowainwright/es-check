import { Link, useLocation } from "@tanstack/react-router";
import { Github, Menu } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { SimpleSearch } from "./SimpleSearch";

const NAVIGATION = [
  { title: "Home", href: "/" },
  { title: "Docs", href: "/docs/gettingstarted" },
];

export function Header() {
  const location = useLocation();
  const pathname = location.pathname;
  const isDocsPage = pathname.startsWith("/docs");

  return (
    <header className="sticky top-0 z-30">
      <nav className="navbar bg-base-100/80 border-b border-base-content/10 backdrop-blur-3xl justify-between items-center py-2 px-4 md:px-20 font-sans">
        <div className="flex items-center gap-2">
          {isDocsPage && <MobileMenuButton />}
          <Logo />
        </div>
        <DesktopNav pathname={pathname} />
        <NavActions />
      </nav>
    </header>
  );
}

function MobileMenuButton() {
  return (
    <label
      htmlFor="app-drawer"
      className="btn btn-ghost btn-square lg:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </label>
  );
}

function Logo() {
  return (
    <Link to="/" className="btn btn-ghost px-2">
      <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
        ES Check
      </span>
    </Link>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <div className="hidden lg:flex">
      <ul className="menu menu-horizontal text-base font-medium">
        {NAVIGATION.map((item) => (
          <li key={item.href}>
            <NavLink
              href={item.href}
              title={item.title}
              isActive={pathname === item.href}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function NavLink({
  href,
  title,
  isActive,
}: {
  href: string;
  title: string;
  isActive: boolean;
}) {
  const activeClass = isActive ? "text-primary bg-primary/5" : "";

  return (
    <Link
      to={href}
      className={`hover:text-primary hover:bg-primary/5 transition flex ${activeClass}`}
    >
      {title}
    </Link>
  );
}

function NavActions() {
  return (
    <div className="flex items-center gap-1">
      <SimpleSearch variant="compact" />
      <a
        className="btn btn-sm btn-ghost btn-square"
        href="https://github.com/yowainwright/es-check"
        aria-label="GitHub"
      >
        <Github className="h-5 w-5" />
      </a>
      <ThemeToggle />
    </div>
  );
}
