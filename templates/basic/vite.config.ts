import tailwindcss from "@tailwindcss/vite";
import { reactRouter } from "@react-router/dev/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
});
