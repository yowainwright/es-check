import { Link } from "@tanstack/react-router";
import { GithubIcon } from "./GithubIcon";
import { resolveUrl } from "@/utils/url";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer px-4 md:px-10 xl:px-28 py-6 md:py-7 border-t border-base-300 font-sans">
      <div className="flex flex-col lg:flex-row w-full justify-between items-center gap-3 md:gap-4">
        <div className="text-sm opacity-70 lg:flex-1 text-center lg:text-left">
          <p>&copy; {year} - MIT License</p>
        </div>

        <FooterLogo />

        <div className="lg:flex-1 flex justify-center lg:justify-end">
          <a
            className="btn btn-sm btn-ghost btn-circle"
            href="https://github.com/yowainwright/es-check"
            aria-label="GitHub"
          >
            <GithubIcon className="h-5 w-5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterLogo() {
  const { ref, isVisible } = useScrollAnimation(0.1, { once: false });
  const appearanceClass = isVisible
    ? "translate-y-0 scale-100 opacity-100"
    : "translate-y-3 scale-95 opacity-0";

  return (
    <div ref={ref} className="size-16 shrink-0">
      <Link to="/" className="block size-full hover:opacity-80 transition-opacity">
        <img
          src={resolveUrl("/es-check-logo.svg")}
          alt="ES Check"
          width={64}
          height={64}
          className={`size-full transition duration-500 ease-out motion-reduce:transition-none motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100 ${appearanceClass}`}
        />
      </Link>
    </div>
  );
}
