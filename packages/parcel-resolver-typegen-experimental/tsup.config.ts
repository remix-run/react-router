import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/typegen.ts"],
  clean: true,
  format: ["cjs"],
  noExternal: ["execa"],
});
