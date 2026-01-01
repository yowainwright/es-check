import { Link } from "@tanstack/react-router";
import { CopyButton } from "./CopyButton";
import { useScrollAnimation } from "@/hooks";

const INSTALL_COMMAND = "npm install es-check --save-dev";

export function InstallSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const animationClass = isVisible
    ? "animate-bounce-up"
    : "opacity-0 translate-y-10";

  return (
    <div ref={ref} className={`py-20 lg:py-28 font-outfit ${animationClass}`}>
      <div className="max-w-4xl mx-auto text-center">
        <SectionHeader />
        <InstallCommand />
        <InstallationGuideLink />
      </div>
    </div>
  );
}

function SectionHeader() {
  return (
    <>
      <h2 className="text-4xl lg:text-5xl font-black">
        <span className="italic">Install</span>{" "}
        <span className="text-primary">ES Check</span>
      </h2>
      <p className="mt-4 text-lg max-w-2xl mx-auto whitespace-nowrap">
        Install ES Check as a development dependency
      </p>
    </>
  );
}

function InstallCommand() {
  return (
    <div className="mt-10">
      <div className="flex items-center bg-base-300 rounded-lg shadow-sm overflow-hidden h-14 border border-base-content/10 w-fit mx-auto px-4">
        <code className="flex-1 text-left text-sm md:text-base overflow-x-auto whitespace-nowrap">
          {INSTALL_COMMAND}
        </code>
        <CopyButton />
      </div>
    </div>
  );
}

function InstallationGuideLink() {
  return (
    <div className="mt-10">
      <Link
        to="/docs/$slug"
        params={{ slug: "installation" }}
        className="btn btn-lg btn-primary btn-glow text-lg"
      >
        Installation Guide
      </Link>
    </div>
  );
}
