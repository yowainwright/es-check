import { Feature } from "./types";

export const FEATURES: Feature[] = [
  {
    title: "Fast",
    description:
      "ES-Check quickly scan thousands of tokens ensuring ES compatibility while minimally effecting you build process.",
    slug: "performance",
  },
  {
    title: "Version Specific",
    description:
      "ES-Check supports all ECMAScript versions from ES5 to ES2025 ensuring your code will work to your specified version or browser spec",
    slug: "options",
  },
  {
    title: "CI/CD Ready",
    description:
      "ES-Check seamlessly integrates with your build pipeline to catch compatibility issues before production.",
    slug: "ci-integration",
  },
  {
    title: "Flexible Configuration",
    description:
      "ES-Check can be executed via CLI arguments or configuration files to customize to your project's specific needs.",
    slug: "configuration",
  },
  {
    title: "Browserslist Support",
    description:
      "ES-Check automatically determines the correct ES version based on your target browsers using browserslist.",
    slug: "browserslist",
  },
  {
    title: "Detailed Error Outputs",
    description:
      "ES-Check can provide precise error locations and descriptions to quickly find and fix compatibility issues.",
    slug: "debugging",
  },
];
