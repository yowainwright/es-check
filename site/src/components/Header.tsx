import { Link, useLocation } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const NAVIGATION = [
  { title: "Home", href: "/" },
  { title: "Docs", href: "/docs/gettingstarted" },
];

export function Header() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <header className="sticky top-0 z-30">
      <nav className="navbar bg-base-100/80 border-b border-base-content/10 backdrop-blur-3xl justify-center items-center py-2 sm:px-0 md:px-20 font-sans">
        <MobileMenu pathname={pathname} />
        <Logo />
        <DesktopNav pathname={pathname} />
        <NavActions />
      </nav>
    </header>
  );
}

function MobileMenu({ pathname }: { pathname: string }) {
  return (
    <div className="dropdown">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-square lg:hidden"
      >
        <MenuIcon />
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
      >
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

function Logo() {
  return (
    <div className="navbar-start">
      <Link to="/" className="btn btn-ghost px-2">
        <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
          ES Check
        </h1>
      </Link>
    </div>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <div className="navbar-center hidden lg:flex">
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
    <div className="navbar-end">
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

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h8m-8 6h16"
      />
    </svg>
  );
}
