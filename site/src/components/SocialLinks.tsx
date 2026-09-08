import { ArrowRight } from "lucide-react";

const LINKS = [
  {
    name: "GitHub",
    href: "https://github.com/yowainwright/es-check",
    description: "Star us on GitHub",
  },
];

export function SocialLinks() {
  return (
    <div className="flex flex-wrap justify-center gap-4 my-12">
      {LINKS.map((link) => (
        <SocialLink key={link.name} {...link} />
      ))}
    </div>
  );
}

interface SocialLinkProps {
  name: string;
  href: string;
  description: string;
}

function SocialLink({ name, href, description }: SocialLinkProps) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-6 py-4 bg-base-200 hover:bg-base-300 rounded-xl transition-colors border border-base-content/10"
    >
      <div>
        <div className="font-semibold">{name}</div>
        <div className="text-sm text-base-content/60">{description}</div>
      </div>
      <ArrowRight className="size-5 text-primary" aria-hidden="true" />
    </a>
  );
}
