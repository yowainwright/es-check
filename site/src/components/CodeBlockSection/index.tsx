import { Link } from "@tanstack/react-router";
import { Terminal } from "../Terminal";
import { AnimatedTerminal } from "../AnimatedTerminal";
import { ES_CHECK_DEMO } from "../AnimatedTerminal/constants";

const TERMINAL_HEIGHT = "530px";
const TYPING_SPEED = 15;

export function CodeBlockSection() {
  return (
    <div className="py-20 lg:py-28 pb-28 lg:pb-36">
      <div className="xl:flex gap-16 items-center max-w-2xl md:max-w-6xl mx-auto px-4">
        <ContentBlock />
        <TerminalBlock />
      </div>
    </div>
  );
}

function ContentBlock() {
  return (
    <div className="xl:max-w-xl flex flex-col justify-center font-outfit">
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
      <Link
        to="/docs/$slug"
        params={{ slug: "features" }}
        className="btn btn-lg btn-primary btn-glow text-lg"
      >
        Learn More
      </Link>
    </div>
  );
}

function TerminalBlock() {
  return (
    <div className="flex-1 mt-7 xl:mt-0 min-w-0 xl:min-w-[500px] xl:max-w-[540px]">
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
