import { Link, useLocation } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { GithubIcon } from "./GithubIcon";
import { ThemeToggle } from "./ThemeToggle";
import { SimpleSearch } from "./SimpleSearch";
import { SITE_NAVIGATION } from "@/constants/sidebar";
import { useLayout } from "@/contexts";

const DESKTOP_NAVIGATION = SITE_NAVIGATION.filter((item) => item.href !== "/");

export function Header() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <header className="sticky top-0 z-30">
      <nav className="navbar bg-base-100/80 border-b border-base-content/10 backdrop-blur-3xl justify-between items-center py-2 px-2 sm:px-4 md:px-20 font-sans">
        <div className="flex shrink-0 items-center gap-2">
          <MobileMenuButton />
          <Logo />
        </div>
        <DesktopNav pathname={pathname} />
        <NavActions />
      </nav>
    </header>
  );
}

function MobileMenuButton() {
  const { menuOpen, setMenuOpen } = useLayout();

  return (
    <button
      type="button"
      className="btn btn-ghost btn-square lg:hidden"
      aria-label="Open menu"
      aria-controls="mobile-menu"
      aria-expanded={menuOpen}
      onClick={() => setMenuOpen(true)}
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

function Logo() {
  return (
    <Link to="/" className="btn btn-ghost px-2" aria-label="ES Check home">
      <span className="whitespace-nowrap text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
        ES Check
      </span>
    </Link>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <div className="hidden lg:flex">
      <ul className="menu menu-horizontal text-base font-medium">
        {DESKTOP_NAVIGATION.map((item) => (
          <li key={item.href}>
            <NavLink href={item.href} title={item.title} isActive={isNavActive(pathname, item)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function isNavActive(pathname: string, item: { href: string; title: string }) {
  if (item.href.startsWith("/release")) return pathname.startsWith("/release");
  if (item.href.startsWith("/docs")) return pathname.startsWith("/docs");
  return pathname === item.href;
}

function NavLink({ href, title, isActive }: { href: string; title: string; isActive: boolean }) {
  const activeClass = isActive ? "text-primary bg-primary/5" : "";

  return (
    <Link
      to={href}
      aria-current={isActive ? "page" : undefined}
      className={`hover:text-primary hover:bg-primary/5 transition flex ${activeClass}`}
    >
      {title}
    </Link>
  );
}

function NavActions() {
  return (
    <div className="flex items-center gap-1">
      <div className="[&_kbd]:hidden sm:[&_kbd]:inline [&_button]:px-2 sm:[&_button]:px-3">
        <SimpleSearch variant="compact" />
      </div>
      <a
        className="btn btn-sm btn-ghost btn-square"
        href="https://github.com/yowainwright/es-check"
        aria-label="GitHub"
      >
        <GithubIcon className="h-5 w-5" aria-hidden="true" />
      </a>
      <ThemeToggle />
    </div>
  );
}
