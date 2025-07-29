export interface SearchItem {
  title: string;
  description: string;
  href: string;
  content: string;
  category?: string;
}

export const searchData: SearchItem[] = [
  // Getting Started
  {
    title: "Getting Started",
    description: "Get started with ES Check - Check JavaScript files ES version",
    href: "/documentation/gettingstarted",
    content: "ES Check checks JavaScript files against ECMAScript version. Installation quick start guide npm install",
    category: "Introduction"
  },
  {
    title: "Installation",
    description: "How to install ES Check in your project",
    href: "/documentation/installation",
    content: "Install ES Check npm yarn global local development dependency save-dev prerequisites node.js",
    category: "Introduction"
  },
  {
    title: "Quick Start",
    description: "Get up and running with ES Check in minutes",
    href: "/documentation/quickstart",
    content: "Quick start ES Check basic usage examples es5 es6 check compatibility CI/CD integration",
    category: "Introduction"
  },

  // Usage
  {
    title: "Command Options",
    description: "All available ES Check command-line options and flags",
    href: "/documentation/options",
    content: "Command options flags module allowHashBang checkFeatures checkForPolyfills ignore allowList verbose quiet silent",
    category: "Usage"
  },
  {
    title: "Configuration",
    description: "How to configure ES Check using .escheckrc files",
    href: "/documentation/configuration",
    content: "Configuration .escheckrc config file JSON ecmaVersion files module settings multiple configurations",
    category: "Usage"
  },
  {
    title: "ES Features",
    description: "ES version specific features detection",
    href: "/documentation/features",
    content: "ES features detection arrow functions classes async await optional chaining nullish coalescing",
    category: "Usage"
  },
  {
    title: "Browserslist Integration",
    description: "Use browserslist to determine ES version",
    href: "/documentation/browserslist",
    content: "Browserslist integration checkBrowser browserslistQuery last 2 versions browser compatibility",
    category: "Usage"
  },

  // Advanced
  {
    title: "Polyfill Detection",
    description: "Detecting and handling polyfills",
    href: "/documentation/polyfills",
    content: "Polyfill detection checkForPolyfills core-js polyfills false positives",
    category: "Advanced"
  },
  {
    title: "CI/CD Integration",
    description: "Integrate ES Check with CI/CD pipelines",
    href: "/documentation/ci-integration",
    content: "CI/CD integration GitHub Actions Jenkins CircleCI Travis build pipeline automation",
    category: "Advanced"
  },
  {
    title: "Debugging",
    description: "Debug ES version issues effectively",
    href: "/documentation/debugging",
    content: "Debugging error messages line numbers acorn parser verbose mode troubleshooting",
    category: "Advanced"
  },

  // Community
  {
    title: "How to Contribute",
    description: "Contributing to ES Check development",
    href: "/documentation/how-to-contribute",
    content: "Contributing pull requests issues fork clone development setup guidelines",
    category: "Contribute"
  },
  {
    title: "Report Issues",
    description: "How to report bugs and issues",
    href: "/documentation/having-an-issue",
    content: "Report issues bugs GitHub issues template reproduction steps error messages",
    category: "Contribute"
  }
];