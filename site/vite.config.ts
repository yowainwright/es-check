import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createRequire } from "node:module";
import path from "node:path";
import manifest from "../package.json" with { type: "json" };

const require = createRequire(import.meta.url);
const { VERSION_ORDER } = require("../lib/constants/es/index.js");
const latestEdition = VERSION_ORDER.at(-1).toUpperCase();

export default defineConfig({
  base: "/es-check",
  define: {
    "import.meta.env.ES_CHECK_VERSION": JSON.stringify(manifest.version),
    "import.meta.env.ES_CHECK_EDITION": JSON.stringify(latestEdition),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    target: ["chrome107", "edge107", "firefox104", "safari16"],
    rolldownOptions: {
      input: ["index.html", "hero/index.html"].map((file) =>
        path.resolve(import.meta.dirname, file),
      ),
      output: {
        codeSplitting: {
          groups: [
            { name: "react-vendor", test: /node_modules[\\/](react|react-dom)[\\/]/ },
            { name: "router", test: /node_modules[\\/]@tanstack[\\/]react-router[\\/]/ },
            { name: "fuse", test: /node_modules[\\/]fuse\.js[\\/]/ },
            {
              name: "mdx",
              test: /node_modules[\\/](@mdx-js[\\/]mdx|remark-gfm|rehype-slug)[\\/]/,
            },
            {
              name: "shiki",
              test: /node_modules[\\/](shiki|@shikijs[\\/](rehype|transformers))[\\/]/,
            },
          ],
        },
      },
    },
  },
});
