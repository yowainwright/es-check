import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  base: "/es-check",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    // Preserve Vite 7's browser targets during the bundler migration.
    target: ["chrome107", "edge107", "firefox104", "safari16"],
    rolldownOptions: {
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
