import { Link } from "@tanstack/react-router";
import { Github, HelpCircle } from "lucide-react";
import { contributors, type Contributor } from "@/constants/contributors";
import { useScrollAnimation } from "@/hooks";

export function ContributorsSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const animationClass = isVisible ? "animate-bounce-up" : "opacity-0 translate-y-10";

  return (
    <div ref={ref} className={`py-20 lg:py-28 font-outfit ${animationClass}`}>
      <SectionHeader />
      <ContributorGrid />
      <HelpCard />
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="text-center mb-12">
      <h2 className="text-4xl lg:text-5xl font-black">
        Our <span className="text-primary">Contributors</span>
      </h2>
      <p className="mt-4 text-lg max-w-2xl mx-auto">
        ES Check is made possible by the amazing open source community. Thank you to all our contributors!
      </p>
    </div>
  );
}

function ContributorGrid() {
  return (
    <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
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
        <div className="w-12 h-12 md:w-14 md:h-14 rounded-full ring ring-base-content/10 ring-offset-base-100 ring-offset-2 hover:ring-primary transition-all">
          <img src={contributor.profile} alt={contributor.name} loading="lazy" />
        </div>
      </div>
    </a>
  );
}

function HelpCard() {
  return (
    <div className="mt-12 text-center">
      <Link
        to="/community"
        className="btn btn-lg btn-primary btn-glow text-lg"
      >
        <HelpCircle className="h-5 w-5" />
        Want to contribute?
        <Github className="h-5 w-5" />
      </Link>
    </div>
  );
}
