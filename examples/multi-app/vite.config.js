import fs from "fs";
import * as path from "path";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rollupReplace from "@rollup/plugin-replace";

function myPlugin(options) {
  return {
    name: "configure-server",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        let url = req.originalUrl;

        if (url.length && !path.extname(url)) {
          let indexFile = path.join(options.rootDir, url, "index.html");
          if (fs.existsSync(indexFile)) {
            req.url += "/index.html";
          }
        }

        next();
      });
    }
  };
}

export default defineConfig({
  // build: {
  //   rollupOptions: {
  //     input: entryPoints("index.html", "feed/index.html", "profile/index.html")
  //   }
  // },
  plugins: [
    myPlugin({ rootDir: __dirname }),
    rollupReplace({
      preventAssignment: true,
      values: {
        __DEV__: JSON.stringify(true),
        "process.env.NODE_ENV": JSON.stringify("development")
      }
    }),
    react()
  ],
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
          )
        }
      }
    : {}
});
