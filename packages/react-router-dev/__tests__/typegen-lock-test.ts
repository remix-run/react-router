import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { acquire } from "../typegen/lock";

describe("typegen lock", () => {
  let tmpDir: string;
  let lockPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rr-lock-test-"));
    lockPath = path.join(tmpDir, ".typegen.lock");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("acquires and releases a lock serially", async () => {
    const release1 = await acquire(lockPath);
    expect(fs.existsSync(lockPath)).toBe(true);

    release1();
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  it("serializes concurrent acquires", async () => {
    const release1 = await acquire(lockPath);
    expect(fs.existsSync(lockPath)).toBe(true);

    const started = Date.now();
    const acquire2Promise = acquire(lockPath);

    // release after a short delay
    await new Promise((r) => setTimeout(r, 200));
    release1();

    const release2 = await acquire2Promise;
    const elapsed = Date.now() - started;
    expect(elapsed).toBeGreaterThanOrEqual(190); // should have waited
    expect(fs.existsSync(lockPath)).toBe(true);

    release2();
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  it("cleans up by returning a release function", async () => {
    let released = false;
    const rel = await acquire(lockPath);
    expect(fs.existsSync(lockPath)).toBe(true);

    // wrap to track
    const trackedRelease = () => {
      rel();
      released = true;
    };

    trackedRelease();
    expect(released).toBe(true);
    expect(fs.existsSync(lockPath)).toBe(false);
  });
});
