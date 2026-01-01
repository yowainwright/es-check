import { Menu, Github } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { SimpleSearch } from "./SimpleSearch";

export function DocsHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-base-content/10 bg-base-100/80 backdrop-blur-xl">
      <nav className="navbar min-h-16 px-4 font-outfit">
        <MobileMenuButton />
        <div className="flex-1">
          <SimpleSearch />
        </div>
        <NavActions />
      </nav>
    </header>
  );
}

function MobileMenuButton() {
  return (
    <div className="flex-none lg:hidden">
      <label htmlFor="docs-drawer" className="btn btn-square btn-ghost">
        <Menu className="h-5 w-5" />
      </label>
    </div>
  );
}

function NavActions() {
  return (
    <div className="flex-none gap-2">
      <a
        className="btn btn-sm btn-ghost btn-square"
        href="https://github.com/yowainwright/es-check"
        aria-label="GitHub"
      >
        <Github className="h-4 w-4" />
      </a>
      <ThemeToggle />
    </div>
  );
}
