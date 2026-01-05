import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { InstallCodeBlock } from "./InstallCodeBlock";
import { NewBadge } from "./NewBadge";
import { resolveUrl } from "@/utils/url";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export function HeroSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const visibleClass = isVisible ? "visible" : "";

  return (
    <div className="hero" ref={ref}>
      <BackgroundBlobs />
      <div className="hero-content text-center min-h-[40rem] font-sans">
        <div className="max-w-2xl md:max-w-6xl">
          <Logo className={`animate-on-scroll ${visibleClass}`} />
          <NewBadge className={`animate-on-scroll stagger-1 ${visibleClass}`} />
          <Headline className={`animate-on-scroll stagger-2 ${visibleClass}`} />
          <Description
            className={`animate-on-scroll stagger-3 ${visibleClass}`}
          />
          <CTAButtons
            className={`animate-on-scroll stagger-4 ${visibleClass}`}
          />
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

function Logo({ className }: { className: string }) {
  return (
    <div className={`flex justify-center mb-8 ${className}`}>
      <img
        src={resolveUrl("/es-check-logo.svg")}
        alt="ES Check"
        className="h-32 w-32 md:h-40 md:w-40"
      />
    </div>
  );
}

function Headline({ className }: { className: string }) {
  return (
    <h1 className={`text-4xl md:text-5xl lg:text-7xl ${className}`}>
      Check JavaScript files
      <br />
      <span className="text-primary font-bold">ES version compatibility</span>
    </h1>
  );
}

function Description({ className }: { className: string }) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <p className="py-7 max-w-4xl text-md md:text-xl lg:text-2xl">
        Ensure your JavaScript files match the ECMAScript version you need. ES
        Check helps prevent incompatible code from breaking production.
      </p>
    </div>
  );
}

function CTAButtons({ className }: { className: string }) {
  return (
    <div
      className={`flex flex-col md:flex-row justify-center items-center gap-5 mt-8 w-full max-w-2xl mx-auto ${className}`}
    >
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

      <InstallCodeBlock className="w-full md:w-fit" />
    </div>
  );
}
