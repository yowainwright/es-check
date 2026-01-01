import { Link } from "@tanstack/react-router";
import { AnimatedTerminal, type TerminalDemo } from "./AnimatedTerminal";

const DEMOS: TerminalDemo[] = [
  {
    lines: [
      { prefix: "$", text: "npx es-check es5 './dist/**/*.js'", animate: true },
      { prefix: "", text: "ES-Check: checking 24 files...", className: "text-cyan-400", delay: 200, animate: false },
      { prefix: "", text: "ES-Check: All files passed!", className: "text-success", delay: 300, animate: false },
      { prefix: "", text: "", delay: 150, animate: false },
      { prefix: "$", text: "npx es-check es6 './src/**/*.js' --module", animate: true, delay: 150 },
      { prefix: "", text: "ES-Check: checking 18 files...", className: "text-cyan-400", delay: 200, animate: false },
      { prefix: "", text: "ES-Check: All files passed!", className: "text-success", delay: 300, animate: false },
      { prefix: "", text: "", delay: 150, animate: false },
      { prefix: "$", text: "npx es-check es5 './build/**/*.js'", animate: true, delay: 150 },
      { prefix: "", text: "ES-Check: checking 3 files...", className: "text-cyan-400", delay: 200, animate: false },
      { prefix: "", text: "ES-Check: 2 files failed!", className: "text-red-400", delay: 300, animate: false },
      { prefix: "", text: "  ./build/app.js:12 - arrow function", className: "text-red-400", delay: 50, animate: false },
      { prefix: "", text: "  ./build/utils.js:8 - const declaration", className: "text-red-400", delay: 50, animate: false },
    ],
    pauseAfter: 3000,
  },
];

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
        Simple <span className="text-primary">ES Version </span>Checking for Production
      </h2>
      <p className="mt-8 text-lg">
        ES Check ensures your JavaScript code is compatible with your target ECMAScript version so you can run your
        code where you want: catch compatibility issues before they reach production, integrate seamlessly with your
        CI/CD pipeline, and maintain confidence in your browser support!
      </p>
      <LearnMoreButton />
    </div>
  );
}

function LearnMoreButton() {
  return (
    <div className="mt-8 flex justify-end">
      <Link to="/docs/$slug" params={{ slug: "features" }} className="btn btn-lg btn-primary btn-glow text-lg">
        Learn More
      </Link>
    </div>
  );
}

function TerminalBlock() {
  return (
    <div className="flex-1 overflow-hidden mt-7 xl:mt-0 min-w-0 xl:min-w-[600px]">
      <div className="code-block-glow rounded-lg">
        <AnimatedTerminal demos={DEMOS} loop={false} typingSpeed={15} height="450px" />
      </div>
    </div>
  );
}
