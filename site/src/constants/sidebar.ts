export interface SidebarItem {
  title: string;
  href: string;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export const SIDEBAR: SidebarSection[] = [
  {
    title: "Overview",
    items: [
      { title: "Introduction", href: "/docs/introduction" },
      { title: "Quick Start", href: "/docs/quickstart" },
    ],
  },
  {
    title: "Usage",
    items: [
      { title: "Command Options", href: "/docs/options" },
      { title: "Configuration", href: "/docs/configuration" },
      { title: "ES Features", href: "/docs/features" },
      { title: "Browserslist", href: "/docs/browserslist" },
    ],
  },
  {
    title: "Advanced",
    items: [
      { title: "Programmatic API", href: "/docs/programmatic-api" },
      { title: "Performance", href: "/docs/performance" },
      { title: "Polyfill Detection", href: "/docs/polyfills" },
      { title: "CI/CD Integration", href: "/docs/ci-integration" },
      { title: "Debugging", href: "/docs/debugging" },
      { title: "Source Maps", href: "/docs/source-maps" },
    ],
  },
  {
    title: "Contribute",
    items: [{ title: "Contributing Guidelines", href: "/docs/contributing-guideline" }],
  },
];

export const SITE_NAVIGATION = [
  { title: "Home", href: "/" },
  { title: "Docs", href: "/docs/introduction" },
  { title: "Releases", href: "/release" },
];
