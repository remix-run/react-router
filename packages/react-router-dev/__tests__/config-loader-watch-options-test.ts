import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createConfigLoader, type ConfigLoader } from "../config/config";

import withApp from "./utils/withApp";

const CONFIG_LOADER_FIXTURE = fileURLToPath(
  new URL("./fixtures/config-loader", import.meta.url),
);
const APP_DIR = "app";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function hasChange(changes: string[], relativePath: string) {
  return changes.some((change) => change.endsWith(relativePath));
}

// Chokidar doesn't expose its "ready" event through the config loader, so we
// keep adding files until we observe one of them, which proves the watcher is
// active before we assert on the files that are expected to be ignored.
async function waitForAddedFile(
  changes: string[],
  projectDir: string,
  relativeDirectory: string,
  timeout = 10_000,
) {
  let startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    let relativePath = path.join(
      relativeDirectory,
      `added-${Date.now()}-${Math.random().toString(32).slice(2)}.txt`,
    );
    fs.writeFileSync(path.join(projectDir, relativePath), "");
    await sleep(100);

    if (hasChange(changes, relativePath)) {
      return relativePath;
    }
  }

  throw new Error(
    `Timed out waiting for an added file in "${relativeDirectory}"`,
  );
}

async function withWatchedLoader(
  watchOptions: Parameters<typeof createConfigLoader>[0]["watchOptions"],
  callback: (args: { projectDir: string; changes: string[] }) => Promise<void>,
) {
  await withApp(CONFIG_LOADER_FIXTURE, async (projectDir) => {
    let loader: ConfigLoader = await createConfigLoader({
      rootDirectory: projectDir,
      mode: "development",
      watch: true,
      watchOptions,
    });

    let changes: string[] = [];
    let unsubscribe = loader.onChange(({ path: changedPath }) => {
      changes.push(changedPath);
    });

    try {
      await callback({ projectDir, changes });
    } finally {
      unsubscribe();
      await loader.close();
    }
  });
}

describe("createConfigLoader watch options", () => {
  it("ignores paths matched by the `ignored` option", async () => {
    await withWatchedLoader(
      { ignored: ["**/vendored/**"] },
      async ({ projectDir, changes }) => {
        await waitForAddedFile(changes, projectDir, APP_DIR);

        let vendoredDir = path.join(projectDir, APP_DIR, "vendored");
        fs.mkdirSync(vendoredDir, { recursive: true });

        changes.length = 0;
        fs.writeFileSync(path.join(vendoredDir, "data.py"), "");
        await sleep(1000);
        expect(changes).toEqual([]);

        // Files that aren't ignored must still be watched
        await waitForAddedFile(changes, projectDir, APP_DIR);
      },
    );
  }, 30_000);

  it("ignores paths matched by a relative directory path", async () => {
    await withWatchedLoader(
      { ignored: ["app/vendored"] },
      async ({ projectDir, changes }) => {
        await waitForAddedFile(changes, projectDir, APP_DIR);

        let vendoredDir = path.join(projectDir, APP_DIR, "vendored", "deep");
        fs.mkdirSync(vendoredDir, { recursive: true });

        changes.length = 0;
        fs.writeFileSync(path.join(vendoredDir, "data.py"), "");
        await sleep(1000);
        expect(changes).toEqual([]);

        await waitForAddedFile(changes, projectDir, APP_DIR);
      },
    );
  }, 30_000);

  it("ignores paths matched by an `ignored` function", async () => {
    await withWatchedLoader(
      { ignored: (watchedPath: string) => watchedPath.includes("vendored") },
      async ({ projectDir, changes }) => {
        await waitForAddedFile(changes, projectDir, APP_DIR);

        let vendoredDir = path.join(projectDir, APP_DIR, "vendored");
        fs.mkdirSync(vendoredDir, { recursive: true });

        changes.length = 0;
        fs.writeFileSync(path.join(vendoredDir, "data.py"), "");
        await sleep(1000);
        expect(changes).toEqual([]);

        await waitForAddedFile(changes, projectDir, APP_DIR);
      },
    );
  }, 30_000);

  it("still ignores paths outside the app directory when the `ignored` option matches everything", async () => {
    await withWatchedLoader(
      { ignored: () => false },
      async ({ projectDir, changes }) => {
        await waitForAddedFile(changes, projectDir, APP_DIR);

        let nestedDir = path.join(projectDir, "public", "nested");
        fs.mkdirSync(nestedDir, { recursive: true });

        changes.length = 0;
        fs.writeFileSync(path.join(nestedDir, "data.txt"), "");
        await sleep(1000);
        expect(changes).toEqual([]);
      },
    );
  }, 30_000);
});
