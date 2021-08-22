import * as path from "path";
import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import rollupReplace from "@rollup/plugin-replace";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    rollupReplace({
      preventAssignment: true,
      values: {
        __DEV__: JSON.stringify(true),
        "process.env.NODE_ENV": JSON.stringify("development")
      }
    }),
    reactRefresh()
  ],
  resolve: {
    alias: {
      "react-router": path.resolve(
        __dirname,
        "../../packages/react-router/index.tsx"
      ),
      "react-router-dom": path.resolve(
        __dirname,
        "../../packages/react-router-dom/index.tsx"
      )
    }
  }
});
