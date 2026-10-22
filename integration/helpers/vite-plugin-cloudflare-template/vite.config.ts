import { reactRouter } from "@react-router/dev/vite";
import { createServer } from "node:net";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "@cloudflare/vite-plugin";

async function getAvailablePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();

    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const address = server.address();
      server.close(() => {
        if (address && typeof address === "object") {
          resolve(address.port);
        } else {
          reject(new Error("Unable to find an available port"));
        }
      });
    });
  });
}

export default defineConfig(async () => ({
  plugins: [
    cloudflare({
      inspectorPort: await getAvailablePort(),
      viteEnvironment: { name: "ssr" },
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
}));
