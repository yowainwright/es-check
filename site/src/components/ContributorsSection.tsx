import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { contributors, type Contributor } from "@/constants/contributors";
import { useScrollAnimation } from "@/hooks";

export function ContributorsSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const animationClass = isVisible
    ? "animate-bounce-up"
    : "opacity-0 translate-y-10";

  return (
    <div ref={ref} className={`py-20 lg:py-28 font-sans ${animationClass}`}>
      <div className="flex flex-col xl:flex-row gap-16 items-center justify-center max-w-2xl md:max-w-6xl mx-auto">
        <SectionHeader />
        <ContributorGrid />
      </div>
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="lg:max-w-sm lg:text-right">
      <h2 className="text-4xl lg:text-5xl font-black">
        <span className="text-primary">Contributors</span>
      </h2>
      <p className="mt-4 text-lg">
        ES Check has been built by a lot of great contributors.
      </p>
      <div className="mt-6 flex lg:justify-end">
        <Link to="/community" className="btn btn-primary">
          Contribute
          <Github className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function ContributorGrid() {
  return (
    <div className="flex flex-wrap justify-start gap-3 w-full lg:max-w-sm">
      {contributors.map((contributor) => (
        <ContributorAvatar key={contributor.name} contributor={contributor} />
      ))}
    </div>
  );
}

function ContributorAvatar({ contributor }: { contributor: Contributor }) {
  return (
    <a
      href={contributor.githubUrl}
      className="tooltip"
      data-tip={`${contributor.name} (${contributor.contributions} contributions)`}
    >
      <div className="avatar">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full ring ring-base-content/10 ring-offset-base-100 ring-offset-2 hover:ring-primary transition-all">
          <img
            src={contributor.profile}
            alt={contributor.name}
            loading="lazy"
          />
        </div>
      </div>
    </a>
  );
}
