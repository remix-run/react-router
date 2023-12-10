import * as path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import paths from "vite-tsconfig-paths";

import remix from "./remix.plugin.js";

export default defineConfig(() => ({
  plugins: [
    paths(),
    remix({
      isRoute(id) {
        return /app\/routes\/.*\/route\.tsx/.test(id);
      },
    }),
    react(),
  ],
  resolve: {
    extensions: [".js", ".ts", ".tsx"],
    alias: {
      "*.tsx": "*.js",
      "*.ts": "*.js",
      ...(process.env.USE_SOURCE
        ? {
            "@remix-run/router": path.resolve(
              __dirname,
              "../../packages/router/dist/router.js"
            ),
            "react-router": path.resolve(
              __dirname,
              "../../packages/react-router/dist/index.js"
            ),
            "react-router-dom/server": path.resolve(
              __dirname,
              "../../packages/react-router-dom/dist/server.mjs"
            ),
            "react-router-dom": path.resolve(
              __dirname,
              "../../packages/react-router-dom/dist/index.js"
            ),
          }
        : {}),
    },
  },
}));
