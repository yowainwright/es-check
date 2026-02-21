import type { SearchItem } from "./types";

export const SEARCH_DATA: SearchItem[] = [
  {
    title: "Getting Started",
    description:
      "Get started with ES Check - Check JavaScript files ES version",
    href: "/docs/gettingstarted",
    content:
      "ES Check checks JavaScript files against ECMAScript version. Installation quick start guide npm install",
    category: "Introduction",
  },
  {
    title: "Installation",
    description: "How to install ES Check in your project",
    href: "/docs/installation",
    content:
      "Install ES Check npm yarn global local development dependency save-dev prerequisites node.js",
    category: "Introduction",
  },
  {
    title: "Quick Start",
    description: "Get up and running with ES Check in minutes",
    href: "/docs/quickstart",
    content:
      "Quick start ES Check basic usage examples es5 es6 check compatibility CI/CD integration",
    category: "Introduction",
  },
  {
    title: "Command Options",
    description: "All available ES Check command-line options and flags",
    href: "/docs/options",
    content:
      "Command options flags module allowHashBang checkFeatures checkForPolyfills ignorePolyfillable ignore allowList verbose quiet silent typescript",
    category: "Usage",
  },
  {
    title: "Configuration",
    description: "How to configure ES Check using .escheckrc files",
    href: "/docs/configuration",
    content:
      "Configuration .escheckrc config file JSON ecmaVersion files module settings multiple configurations",
    category: "Usage",
  },
  {
    title: "ES Features",
    description: "ES version specific features detection",
    href: "/docs/features",
    content:
      "ES features detection arrow functions classes async await optional chaining nullish coalescing",
    category: "Usage",
  },
  {
    title: "Browserslist Integration",
    description: "Use browserslist to determine ES version",
    href: "/docs/browserslist",
    content:
      "Browserslist integration checkBrowser browserslistQuery last 2 versions browser compatibility",
    category: "Usage",
  },
  {
    title: "Polyfill Detection",
    description: "Detecting and handling polyfills",
    href: "/docs/polyfills",
    content:
      "Polyfill detection checkForPolyfills ignorePolyfillable core-js polyfills false positives",
    category: "Advanced",
  },
  {
    title: "CI/CD Integration",
    description: "Integrate ES Check with CI/CD pipelines",
    href: "/docs/ci-integration",
    content:
      "CI/CD integration GitHub Actions Jenkins CircleCI Travis build pipeline automation",
    category: "Advanced",
  },
  {
    title: "Debugging",
    description: "Debug ES version issues effectively",
    href: "/docs/debugging",
    content:
      "Debugging error messages line numbers acorn parser verbose mode troubleshooting",
    category: "Advanced",
  },
  {
    title: "How to Contribute",
    description: "Contributing to ES Check development",
    href: "/docs/how-to-contribute",
    content:
      "Contributing pull requests issues fork clone development setup guidelines",
    category: "Contribute",
  },
  {
    title: "Contributing Guidelines",
    description: "Guidelines for contributing to ES Check",
    href: "/docs/contributing-guideline",
    content:
      "Contributing guidelines code standards pull request process testing requirements MIT license",
    category: "Contribute",
  },
  {
    title: "Report Issues",
    description: "How to report bugs and issues",
    href: "/docs/having-an-issue",
    content:
      "Report issues bugs GitHub issues template reproduction steps error messages",
    category: "Contribute",
  },
];

export const FUSE_OPTIONS = {
  keys: [
    { name: "title", weight: 0.4 },
    { name: "description", weight: 0.3 },
    { name: "content", weight: 0.2 },
    { name: "category", weight: 0.1 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};
