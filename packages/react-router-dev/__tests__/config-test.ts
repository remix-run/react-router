import path from "node:path";
import fs from "node:fs";
import {
  loadConfig,
  createConfigLoader,
  type ResolvedReactRouterConfig,
} from "../config/config";

describe("config", () => {
  let fixture = path.join(__dirname, "fixtures", "config");
  let root: string;

  beforeEach(() => {
    root = path.join(
      __dirname,
      ".tmp",
      `config-${Math.random().toString(36).slice(0, 5)}`
    );
    fs.cpSync(fixture, root, { recursive: true });
  });

  it("loads config", async () => {
    expect(await loadConfig({ root })).toMatchObject({
      ok: true,
      value: {
        appDirectory: path.join(root, "custom-app"),
        basename: "/",
        buildDirectory: path.join(root, "build"),
        future: {},
        routes: {
          "./routes/index": {
            caseSensitive: undefined,
            file: "./routes/index.tsx",
            id: "./routes/index",
            index: true,
            parentId: "root",
            path: undefined,
          },
          root: {
            file: "root.tsx",
            id: "root",
            path: "",
          },
        },
        serverBuildFile: "index.js",
        serverModuleFormat: "esm",
        ssr: true,
      },
    });
  });

  it("allows watching for changes", async () => {
    let changed = false;
    let config: ResolvedReactRouterConfig | undefined;

    let configLoader = await createConfigLoader({
      root,
      onChange: (result) => {
        config = result.value ?? config;
        changed = true;
      },
    });
    try {
      let result = await configLoader.get();

      if (!result.ok) {
        throw new Error("Error loading config: " + result.error);
      }

      let { value: config } = result;

      expect(config?.routes).toEqual({
        root: {
          file: "root.tsx",
          id: "root",
          path: "",
        },
        "routes/_index": {
          caseSensitive: undefined,
          file: "routes/_index.tsx",
          id: "routes/_index",
          index: true,
          parentId: "root",
        },
      });

      fs.writeFileSync(
        path.join(root, "react-router.config.ts"),
        'export default { appDirectory: "custom-app", serverBuildFile: "new.js" };'
      );

      await waitUntil(() => changed);

      expect(config?.serverBuildFile).toBe("new.js");
    } finally {
      await configLoader.close();
    }
  });
});

async function waitUntil(
  predicate: () => boolean,
  timeout: number = 1000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (predicate()) {
        clearInterval(interval);
        resolve();
      }
    }, 4);

    setTimeout(() => {
      clearInterval(interval);
      reject(new Error(`Timed out waiting after ${timeout}ms`));
    }, timeout);
  });
}
