import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CopyButton } from "./CopyButton";
import { resolveUrl } from "@/utils/url";

export function HeroSection() {
  return (
    <div className="hero">
      <BackgroundBlobs />
      <div className="hero-content text-center min-h-[40rem] font-sans">
        <div className="max-w-2xl md:max-w-6xl">
          <Logo />
          <VersionBadge />
          <Headline />
          <Description />
          <CTAButtons />
        </div>
      </div>
    </div>
  );
}

function BackgroundBlobs() {
  const blobStyle = {
    clipPath:
      "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 150%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
  };

  return (
    <div
      className="absolute inset-x-0 top-50 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
      aria-hidden="true"
    >
      <div
        className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] bg-gradient-to-tr from-primary to-primary/50 opacity-15 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        style={blobStyle}
      />
      <div
        className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[70deg] bg-gradient-to-tr from-primary to-primary/50 opacity-15 sm:left-[calc(100%)] sm:w-[72.1875rem]"
        style={blobStyle}
      />
    </div>
  );
}

function Logo() {
  return (
    <div className="flex justify-center mb-8 animate-logo-grow">
      <img
        src={resolveUrl("/es-check-logo.svg")}
        alt="ES Check"
        className="h-32 w-32 md:h-40 md:w-40"
      />
    </div>
  );
}

function VersionBadge() {
  return (
    <a
      className="badge badge-outline badge-xs md:badge-lg mb-5 p-2 border-dashed border-base-content/40 motion-safe:animate-[fadeUp_0.6s_ease-out_0.1s_both]"
      href="https://github.com/yowainwright/es-check/releases"
    >
      ES Check v9.4.7 • Now with ES2025 support
    </a>
  );
}

function Headline() {
  return (
    <h1 className="text-4xl md:text-5xl lg:text-7xl motion-safe:animate-[fadeUp_0.6s_ease-out_0.2s_both]">
      Check JavaScript files
      <br />
      <span className="text-primary font-bold">ES version compatibility</span>
    </h1>
  );
}

function Description() {
  return (
    <div className="flex justify-center items-center motion-safe:animate-[fadeUp_0.6s_ease-out_0.3s_both]">
      <p className="py-7 max-w-4xl text-md md:text-xl lg:text-2xl">
        Ensure your JavaScript files match the ECMAScript version you need. ES
        Check helps prevent incompatible code from breaking production.
      </p>
    </div>
  );
}

function CTAButtons() {
  return (
    <div className="flex flex-col md:flex-row justify-center items-center gap-5 mt-8 w-full max-w-2xl mx-auto motion-safe:animate-[fadeUp_0.6s_ease-out_0.4s_both]">
      <Link
        to="/docs/$slug"
        params={{ slug: "gettingstarted" }}
        className="w-full md:w-auto"
      >
        <button className="btn btn-lg btn-primary btn-glow text-lg w-full md:w-auto whitespace-nowrap">
          Get Started
          <ArrowRight className="size-5" />
        </button>
      </Link>

      <InstallCommand />
    </div>
  );
}

function InstallCommand() {
  return (
    <div className="flex items-center bg-base-300 rounded-lg shadow-sm overflow-hidden h-12 py-1 border border-base-content/10 w-fit">
      <ChevronIcon />
      <code className="text-left leading-none text-sm md:text-base pr-2 whitespace-nowrap">
        npm i es-check --save-dev
      </code>
      <CopyButton />
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="22"
      height="13"
      viewBox="0 0 22 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="relative ml-4 mr-2 block w-3 flex-shrink-0 -rotate-90"
    >
      <path d="M1 1L11 11L21 1" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
