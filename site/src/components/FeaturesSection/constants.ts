import { Feature } from "./types";

export const FEATURES: Feature[] = [
  {
    title: "Fast",
    description:
      "Quickly scan thousands of tokens to ensure ES compatibility without slowing down your build process.",
    slug: "performance",
  },
  {
    title: "Version Specific",
    description:
      "Support for all ECMAScript versions from ES3 to ES16/ES2025, ensuring comprehensive coverage.",
    slug: "options",
  },
  {
    title: "CI/CD Ready",
    description:
      "Seamlessly integrate with your build pipeline to catch compatibility issues before production.",
    slug: "ci-integration",
  },
  {
    title: "Flexible Configuration",
    description:
      "Use CLI arguments or configuration files to customize ES Check for your specific needs.",
    slug: "configuration",
  },
  {
    title: "Browserslist Support",
    description:
      "Automatically determine ES version based on your target browsers using browserslist integration.",
    slug: "browserslist",
  },
  {
    title: "Detailed Error Reports",
    description:
      "Get precise error locations and descriptions to quickly fix compatibility issues.",
    slug: "debugging",
  },
];
