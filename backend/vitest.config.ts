import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    // Isolation keeps rate-limit + env mutations from leaking across files.
    fileParallelism: false,
  },
  resolve: {
    alias: [
      {
        find: "@/types",
        replacement: path.resolve(__dirname, "../shared/types"),
      },
      { find: "@", replacement: path.resolve(__dirname, ".") },
      { find: "@shared", replacement: path.resolve(__dirname, "../shared") },
    ],
  },
});
