import { Github } from "lucide-react";

const LINKS = [
  {
    name: "GitHub",
    href: "https://github.com/yowainwright/es-check",
    icon: Github,
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
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

function SocialLink({ name, href, icon: Icon, description }: SocialLinkProps) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-6 py-4 bg-base-200 hover:bg-base-300 rounded-xl transition-colors border border-base-content/10"
    >
      <Icon className="h-6 w-6 text-primary" />
      <div>
        <div className="font-semibold">{name}</div>
        <div className="text-sm text-base-content/60">{description}</div>
      </div>
    </a>
  );
}
