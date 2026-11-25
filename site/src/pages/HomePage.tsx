import { useEffect } from "react";
import { HeroSection } from "@/components";

export function HomePage() {
  useEffect(() => {
    const existing = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const robots = existing ?? document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex";
    document.head.append(robots);
    return () => robots.remove();
  }, []);

  return (
    <div className="relative isolate grid h-full overflow-clip px-3 md:px-10 xl:px-28">
      <HeroSection />
    </div>
  );
}
