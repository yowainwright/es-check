import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { resolveUrl } from "@/utils/url";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer px-4 md:px-10 xl:px-28 py-6 md:py-7 border-t border-base-300 font-sans">
      <div className="flex flex-col lg:flex-row w-full justify-between items-center gap-3 md:gap-4">
        <div className="text-sm opacity-70 lg:flex-1 text-center lg:text-left">
          <p>&copy; {year} - MIT License</p>
        </div>

        <Link to="/" className="hover:opacity-80 transition">
          <img
            src={resolveUrl("/es-check-logo.svg")}
            alt="ES Check"
            className="h-8 w-8"
          />
        </Link>

        <div className="lg:flex-1 flex justify-center lg:justify-end">
          <a
            className="btn btn-sm btn-ghost btn-circle"
            href="https://github.com/yowainwright/es-check"
            aria-label="GitHub"
          >
            <Github className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
