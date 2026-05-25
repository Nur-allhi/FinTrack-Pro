import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["api/tests/**/*.test.ts", "src/tests/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.codex/**"],
    testTimeout: 15000,
  },
});
