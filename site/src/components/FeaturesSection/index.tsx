import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks";
import { FEATURES } from "./constants";
import { FeatureCardProps } from "./types";

export function FeaturesSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <div
      ref={ref}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10 justify-items-center py-16 md:py-20 lg:py-28 px-4 md:px-8"
    >
      {FEATURES.map((feature, index) => (
        <FeatureCard
          key={feature.slug}
          feature={feature}
          index={index}
          isVisible={isVisible}
        />
      ))}
    </div>
  );
}

export function FeatureCard({ feature, index, isVisible }: FeatureCardProps) {
  const baseClasses =
    "card w-full max-w-sm md:max-w-2xl bg-gradient-to-t from-base-100 to-base-300/50 border border-base-content/10 hover:border-primary/40 transition-all duration-200 cursor-pointer sparkle-border";
  const visibilityClasses = isVisible
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-8";
  const delayStyle = { transitionDelay: `${index * 100}ms` };

  return (
    <Link
      to="/docs/$slug"
      params={{ slug: feature.slug }}
      className={`${baseClasses} ${visibilityClasses} transition-[opacity,transform] duration-500 ease-out`}
      style={delayStyle}
    >
      <div className="card-body font-outfit p-6 md:p-8">
        <h2 className="card-title text-lg md:text-xl flex items-center justify-between">
          {feature.title}
          <ArrowRight className="w-5 h-5 text-primary" />
        </h2>
        <p className="text-sm md:text-base">{feature.description}</p>
      </div>
    </Link>
  );
}
