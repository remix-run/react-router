import { fork } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createLock } from "../typegen/lock";

describe("typegen lock", () => {
  let tmpDir: string;
  let lockPath: string;
  let lock: ReturnType<typeof createLock>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rr-lock-test-"));
    lockPath = path.join(tmpDir, ".react-router", ".typegen.lock");
    lock = createLock(lockPath);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("waits for another process and cleans up on exit", async () => {
    let worker = fork(
      new URL("./utils/typegen-lock-worker.mjs", import.meta.url),
      [lockPath],
      { execArgv: ["--experimental-strip-types"], silent: true },
    );
    let exited = once(worker, "exit");
    try {
      await once(worker, "message");
      await expect(
        createLock(lockPath, { timeoutMs: 30 }).act(() => undefined),
      ).rejects.toThrow("Timed out waiting for the typegen lock");
      expect(fs.readFileSync(lockPath, "utf8")).toBe(String(worker.pid));

      let waiting = lock.act(() => "acquired");
      worker.send("exit");
      await exited;
      await expect(waiting).resolves.toBe("acquired");
      expect(fs.existsSync(lockPath)).toBe(false);
    } finally {
      if (worker.exitCode === null && worker.signalCode === null) {
        worker.kill("SIGKILL");
        await exited;
      }
    }
  });

  it("holds the lock while signal handlers await shutdown", async () => {
    let worker = fork(
      new URL("./utils/typegen-lock-worker.mjs", import.meta.url),
      [lockPath, "shutdown"],
      { execArgv: ["--experimental-strip-types"], silent: true },
    );
    let exited = once(worker, "exit");
    try {
      await once(worker, "message");
      let signaled = once(worker, "message");
      worker.send("signal");
      expect(await signaled).toEqual(["signaled", undefined]);

      await expect(
        createLock(lockPath, { timeoutMs: 30 }).act(() => undefined),
      ).rejects.toThrow("Timed out waiting for the typegen lock");

      worker.send("finish");
      await exited;
      await expect(
        lock.act(() => fsp.readFile(`${lockPath}.result`, "utf8")),
      ).resolves.toBe("finished");
      expect(fs.existsSync(lockPath)).toBe(false);
    } finally {
      if (worker.exitCode === null && worker.signalCode === null) {
        worker.kill("SIGKILL");
        await exited;
      }
    }
  });

  it.each(["", "2147483647"])(
    "fails with cleanup instructions for an abandoned lock containing %p",
    async (contents) => {
      fs.mkdirSync(path.dirname(lockPath), { recursive: true });
      fs.writeFileSync(lockPath, contents);
      let lock = createLock(lockPath, { timeoutMs: 30 });

      let results = await Promise.allSettled(
        [1, 2].map(() => lock.act(() => undefined)),
      );
      for (let result of results) {
        expect(result).toMatchObject({
          status: "rejected",
          reason: {
            message: expect.stringContaining("remove the lock file"),
          },
        });
      }
      expect(fs.readFileSync(lockPath, "utf8")).toBe(contents);
    },
  );

  it("removes its lock if writing the PID fails", async () => {
    fs.mkdirSync(path.dirname(lockPath), { recursive: true });
    let fd = await fsp.open(lockPath, "wx");
    let error = new Error("disk full");
    jest.spyOn(fsp, "open").mockResolvedValueOnce(fd);
    jest.spyOn(fd, "write").mockRejectedValueOnce(error);

    await expect(lock.act(() => undefined)).rejects.toBe(error);
    expect(fs.existsSync(lockPath)).toBe(false);
  });

  it("holds the lock until the callback settles and releases after failure", async () => {
    let error = new Error("write failed");
    await expect(
      lock.act(async () => {
        await new Promise<void>((resolve) => setImmediate(resolve));
        expect(fs.existsSync(lockPath)).toBe(true);
        throw error;
      }),
    ).rejects.toBe(error);
    expect(fs.existsSync(lockPath)).toBe(false);

    await expect(lock.act(() => 42)).resolves.toBe(42);
    expect(fs.existsSync(lockPath)).toBe(false);
  });
});
