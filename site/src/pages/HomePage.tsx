import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { HeroSection } from "@/components";

const FeaturesSection = lazy(() =>
  import("@/components/FeaturesSection").then((m) => ({ default: m.FeaturesSection }))
);
const CodeBlockSection = lazy(() =>
  import("@/components/CodeBlockSection").then((m) => ({ default: m.CodeBlockSection }))
);
const ContributorsSection = lazy(() =>
  import("@/components/ContributorsSection").then((m) => ({ default: m.ContributorsSection }))
);
const InstallSection = lazy(() =>
  import("@/components/InstallSection").then((m) => ({ default: m.InstallSection }))
);

function SectionLoader() {
  return (
    <div className="h-96 flex items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

export function HomePage() {
  return (
    <div className="px-3 md:px-10 xl:px-28">
      <HeroSection />
      <Suspense fallback={<SectionLoader />}>
        <FeaturesSection />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <CodeBlockSection />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <ContributorsSection />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <InstallSection />
      </Suspense>
    </div>
  );
}
