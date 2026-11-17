import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/lib/retrieval/chunk.test.ts", "src/lib/scoring/*.test.ts", "src/lib/documents/*.test.ts"],
  },
});
