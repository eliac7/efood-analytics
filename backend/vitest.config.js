import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.js"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["services/**/*.js", "routes/**/*.js", "middlewares/**/*.js", "constants/**/*.js", "utils/**/*.js", "app.js"],
    },
  },
});
