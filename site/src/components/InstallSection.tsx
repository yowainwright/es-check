import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import { InstallCodeBlock } from "./InstallCodeBlock";
import { useScrollAnimation } from "@/hooks";

export function InstallSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const animationClass = isVisible
    ? "animate-bounce-up"
    : "opacity-0 translate-y-10";

  return (
    <div ref={ref} className={`py-20 lg:py-28 font-sans ${animationClass}`}>
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
      <p className="mt-4 text-lg max-w-2xl mx-auto">
        Install ES Check as a development dependency
      </p>
    </>
  );
}

function InstallCommand() {
  return (
    <div className="mt-10">
      <InstallCodeBlock className="w-full md:w-fit md:mx-auto" />
    </div>
  );
}

function InstallationGuideLink() {
  return (
    <div className="mt-10">
      <Link to="/docs/$slug" params={{ slug: "installation" }}>
        <button className="btn btn-lg btn-primary btn-glow text-lg w-full md:w-auto">
          Installation Guide
          <Rocket className="size-5" />
        </button>
      </Link>
    </div>
  );
}
