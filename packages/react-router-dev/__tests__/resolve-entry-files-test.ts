import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { resolveEntryFiles } from "../config/config";
import type { ResolvedReactRouterConfig } from "../config/config";

describe("resolveEntryFiles", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "rr-entry-test-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("does not add isbot to package.json when ssr is false", async () => {
    let pkgJsonPath = path.join(tmpDir, "package.json");
    let initialPkgJson = {
      name: "test-app",
      dependencies: {
        react: "^19.0.0",
      },
    };
    await fs.writeFile(pkgJsonPath, JSON.stringify(initialPkgJson, null, 2));

    let appDirectory = path.join(tmpDir, "app");
    await fs.mkdir(appDirectory);

    let reactRouterConfig = {
      appDirectory,
      ssr: false,
      future: {
        unstable_enableNodeReadableStream: false,
      },
    } as unknown as ResolvedReactRouterConfig;

    await resolveEntryFiles({
      rootDirectory: tmpDir,
      reactRouterConfig,
    });

    let updatedPkgJson = JSON.parse(await fs.readFile(pkgJsonPath, "utf-8"));
    expect(updatedPkgJson.dependencies.isbot).toBeUndefined();
  });
});
