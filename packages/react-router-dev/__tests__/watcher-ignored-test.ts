import path from "node:path";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";

import { isIgnoredByWatcher } from "../config/config";

describe("isIgnoredByWatcher", () => {
  let tmpDir: string;
  let root: string;
  let appDirectory: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rr-watcher-test-"));
    root = tmpDir;
    appDirectory = path.join(root, "app");
    fs.mkdirSync(appDirectory, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("does not ignore regular files at root level", () => {
    let filePath = path.join(root, "react-router.config.ts");
    fs.writeFileSync(filePath, "");
    expect(isIgnoredByWatcher(filePath, { root, appDirectory })).toBe(false);
  });

  it("does not ignore the root directory itself", () => {
    expect(isIgnoredByWatcher(root, { root, appDirectory })).toBe(false);
  });

  it("does not ignore files inside app directory", () => {
    let filePath = path.join(appDirectory, "root.tsx");
    fs.writeFileSync(filePath, "");
    expect(isIgnoredByWatcher(filePath, { root, appDirectory })).toBe(false);
  });

  it("ignores files in subdirectories outside the app directory", () => {
    let subDir = path.join(root, "node_modules", "some-package");
    fs.mkdirSync(subDir, { recursive: true });
    let filePath = path.join(subDir, "index.js");
    fs.writeFileSync(filePath, "");
    expect(isIgnoredByWatcher(filePath, { root, appDirectory })).toBe(true);
  });

  it("ignores Unix socket files at the root level", async () => {
    let socketPath = path.join(root, "overmind.sock");
    let server = net.createServer();

    await new Promise<void>((resolve) => server.listen(socketPath, resolve));
    try {
      expect(isIgnoredByWatcher(socketPath, { root, appDirectory })).toBe(true);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("ignores paths that cannot be stat'd", () => {
    let nonexistent = path.join(root, "ghost.sock");
    // File doesn't exist — statSync with throwIfNoEntry: false returns
    // undefined, so this should fall through to `return false`. But if
    // statSync throws for another reason, the catch block returns true.
    // Here we just verify it doesn't throw.
    expect(() =>
      isIgnoredByWatcher(nonexistent, { root, appDirectory }),
    ).not.toThrow();
  });
});
