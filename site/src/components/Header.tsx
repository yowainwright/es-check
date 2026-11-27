import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { GithubIcon } from "./GithubIcon";
import { ThemeToggle } from "./ThemeToggle";
import { SimpleSearch } from "./SimpleSearch";
import { useLayout } from "@/contexts";

export function Header() {
  return (
    <header className="sticky top-0 z-30">
      <nav className="navbar bg-base-100/80 border-b border-base-content/10 backdrop-blur-3xl justify-between items-center py-2 px-2 sm:px-4 md:px-20 font-sans">
        <div className="flex shrink-0 items-center gap-2">
          <MobileMenuButton />
          <Logo />
        </div>
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
    <Link
      to="/docs/$slug"
      params={{ slug: "introduction" }}
      className="inline-flex h-10 items-center rounded-field px-2 hover:bg-base-content/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label="ES Check home"
    >
      <span className="whitespace-nowrap text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
        ES Check
      </span>
    </Link>
  );
}

function NavActions() {
  return (
    <div className="flex items-center gap-1">
      <Link
        to="/release"
        className="btn btn-ghost hidden text-base font-medium lg:inline-flex"
        activeProps={{ className: "text-primary bg-primary/5" }}
      >
        Releases
      </Link>
      <div className="[&_kbd]:hidden sm:[&_kbd]:inline [&_button]:px-2 sm:[&_button]:px-3">
        <SimpleSearch variant="compact" />
      </div>
      <a
        className="btn btn-sm btn-ghost btn-square"
        href="https://github.com/yowainwright/es-check"
        aria-label="GitHub"
      >
        <GithubIcon className="size-4" aria-hidden="true" />
      </a>
      <ThemeToggle />
    </div>
  );
}
