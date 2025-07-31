/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  plugins: [
    require('daisyui'),
    require('@tailwindcss/typography'),
  ],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#2563eb",
          "primary-content": "#ffffff",
          "secondary": "#60a5fa",
          "accent": "#3b82f6",
          "neutral": "#374151",
          "base-100": "#ffffff",
          "base-200": "#f3f4f6",
          "base-300": "#e5e7eb",
          "base-content": "#1f2937",
          "info": "#3b82f6",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444"
        },
      },
      {
        dark: {
          "primary": "#60a5fa",
          "primary-content": "#1e293b",
          "secondary": "#93bbfc",
          "accent": "#3b82f6",
          "neutral": "#e5e7eb",
          "base-100": "#1e293b",
          "base-200": "#0f172a",
          "base-300": "#334155",
          "base-content": "#f1f5f9",
          "info": "#60a5fa",
          "success": "#10b981",
          "warning": "#f59e0b",
          "error": "#ef4444"
        },
      },
    ],
  },
}