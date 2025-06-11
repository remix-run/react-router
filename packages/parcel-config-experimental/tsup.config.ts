import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/transformer.ts"],
  clean: true,
  format: ["cjs"],
});
