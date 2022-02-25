import * as path from "path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rollupReplace from "@rollup/plugin-replace";

export default defineConfig({
  plugins: [
    rollupReplace({
      preventAssignment: true,
      values: {
        __DEV__: JSON.stringify(true),
        "process.env.NODE_ENV": JSON.stringify("development"),
      },
    }),
    react(),
  ],
  build: {
    rollupOptions: {
      // Build two separate bundles, one for each app.
      input: {
        main: path.resolve(__dirname, "index.html"),
        inbox: path.resolve(__dirname, "inbox/index.html"),
      },
    },
  },
  resolve: process.env.USE_SOURCE
    ? {
        alias: {
          "react-router": path.resolve(
            __dirname,
            "../../packages/react-router/index.tsx"
          ),
          "react-router-dom": path.resolve(
            __dirname,
            "../../packages/react-router-dom/index.tsx"
          ),
        },
      }
    : {},
});
