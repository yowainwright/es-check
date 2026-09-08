import { Feature } from "./types";

export const FEATURES: Feature[] = [
  {
    title: "Fast",
    description:
      "ES Check quickly scans JavaScript files for compatibility with your target ECMAScript version.",
    slug: "performance",
  },
  {
    title: "Version Specific",
    description:
      "ES Check supports ECMAScript targets from ES5 to ES2026. Check your code against a specified version or target browsers.",
    slug: "options",
  },
  {
    title: "CI/CD Ready",
    description:
      "Run ES Check in your build pipeline to catch compatibility issues before production.",
    slug: "ci-integration",
  },
  {
    title: "Flexible Configuration",
    description:
      "Configure ES Check with CLI arguments or configuration files to suit your project.",
    slug: "configuration",
  },
  {
    title: "Browserslist Support",
    description:
      "ES Check uses Browserslist to select an ECMAScript target based on the browsers you support.",
    slug: "browserslist",
  },
  {
    title: "Detailed Error Outputs",
    description:
      "ES Check reports error locations and descriptions to help you find and fix compatibility issues.",
    slug: "debugging",
  },
];
