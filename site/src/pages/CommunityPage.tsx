import { ContributorsSection, SocialLinks } from "@/components";

export function CommunityPage() {
  return (
    <div className="flex flex-col justify-center min-h-screen mt-10 mb-20 px-5 lg:px-20 font-sans">
      <header className="flex flex-col md:items-center gap-2">
        <h1 className="font-bold text-4xl">
          Join The <span className="text-primary">Community</span>
        </h1>
        <h2 className="font-semibold text-xl opacity-70">
          Supported by the network of contributors and champions
        </h2>
      </header>

      <SocialLinks />
      <ContributorsSection />
    </div>
  );
}
