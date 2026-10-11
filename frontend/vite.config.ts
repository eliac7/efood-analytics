import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    // Only the pure analytics sources are shared; private backend files stay outside the dev server allowlist.
    server: {
      fs: {
        allow: [
          ".",
          "../backend/services/analytics/orders",
          "../backend/constants/locale.ts",
          "../backend/analyticsTypes.ts",
          "../backend/utils/orderDate.ts",
          "../backend/utils/sorting.ts",
        ].map((path) => fileURLToPath(new URL(path, import.meta.url))),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "html-transform",
        transformIndexHtml(html) {
          return html.replace(/%VITE_APP_URL%/g, env.VITE_APP_URL || "");
        },
      },
    ],
    test: {
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      globals: true,
      css: true,
      coverage: {
        provider: "v8",
        reporter: ["text", "html"],
        include: ["src/**/*.{ts,tsx}"],
        exclude: ["src/test/**", "src/**/*.d.ts", "src/main.tsx"],
      },
    },
  };
});
