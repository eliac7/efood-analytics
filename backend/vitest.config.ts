import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["services/**/*.ts", "routes/**/*.ts", "middlewares/**/*.ts", "constants/**/*.ts", "utils/**/*.ts", "app.ts"],
    },
  },
});
