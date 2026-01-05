import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { Terminal } from "../Terminal";
import { AnimatedTerminal } from "../AnimatedTerminal";
import { ES_CHECK_DEMO } from "../AnimatedTerminal/constants";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const TERMINAL_HEIGHT = "475px";
const TYPING_SPEED = 15;

export function CodeBlockSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const visibleClass = isVisible ? "visible" : "";

  return (
    <div className="py-20 lg:py-28 pb-28 lg:pb-36" ref={ref}>
      <div className="xl:flex gap-16 items-center max-w-2xl md:max-w-6xl mx-auto px-4">
        <ContentBlock className={`animate-on-scroll ${visibleClass}`} />
        <TerminalBlock
          className={`animate-on-scroll stagger-2 ${visibleClass}`}
        />
      </div>
    </div>
  );
}

function ContentBlock({ className }: { className: string }) {
  return (
    <div
      className={`xl:max-w-xl flex flex-col justify-center font-sans ${className}`}
    >
      <h2 className="text-4xl lg:text-5xl font-black">
        Simple <span className="text-primary">ES Version </span>Checking for
        Production
      </h2>
      <p className="mt-8 text-lg">
        ES Check ensures your JavaScript code is compatible with your target
        ECMAScript version so you can run your code where you want: catch
        compatibility issues before they reach production, integrate seamlessly
        with your CI/CD pipeline, and maintain confidence in your browser
        support!
      </p>
      <LearnMoreButton />
    </div>
  );
}

function LearnMoreButton() {
  return (
    <div className="mt-8 flex justify-end">
      <Link to="/docs/$slug" params={{ slug: "features" }}>
        <button className="btn btn-lg btn-primary btn-glow text-lg">
          <BookOpen className="size-5" />
          Learn More
        </button>
      </Link>
    </div>
  );
}

function TerminalBlock({ className }: { className: string }) {
  return (
    <div
      className={`flex-1 mt-7 xl:mt-0 min-w-0 xl:min-w-[500px] xl:max-w-[540px] ${className}`}
    >
      <div className="code-block-glow rounded-lg">
        <Terminal title="terminal" height={TERMINAL_HEIGHT}>
          <AnimatedTerminal
            demos={ES_CHECK_DEMO}
            loop={false}
            typingSpeed={TYPING_SPEED}
          />
        </Terminal>
      </div>
    </div>
  );
}
