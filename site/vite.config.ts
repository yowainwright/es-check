import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/es-check",
  builder: "rolldown",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          router: ["@tanstack/react-router"],
          fuse: ["fuse.js"],
          mdx: ["@mdx-js/mdx", "remark-gfm", "rehype-slug"],
          shiki: ["shiki", "@shikijs/rehype", "@shikijs/transformers"],
        },
      },
    },
  },
});
