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
  let workers: Array<ReturnType<typeof fork>>;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rr-lock-test-"));
    lockPath = path.join(tmpDir, ".react-router", ".typegen.lock");
    lock = createLock(lockPath);
    workers = [];
  });

  afterEach(async () => {
    for (let worker of workers) {
      if (worker.exitCode === null && worker.signalCode === null) {
        let exited = once(worker, "exit");
        worker.kill("SIGKILL");
        await exited;
      }
    }
    jest.restoreAllMocks();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function startWorker(mode?: string) {
    let worker = fork(
      new URL("./utils/typegen-lock-worker.mjs", import.meta.url),
      mode ? [lockPath, mode] : [lockPath],
      { execArgv: ["--experimental-strip-types"], silent: true },
    );
    workers.push(worker);
    return worker;
  }

  it.each(["exit", "signal"])(
    "waits for another process and cleans up on %s",
    async (shutdown) => {
      let worker = startWorker();
      let exited = once(worker, "exit");
      await once(worker, "message");
      await expect(
        createLock(lockPath, { timeoutMs: 30 }).act(() => undefined),
      ).rejects.toThrow("Timed out waiting for the typegen lock");
      expect(fs.readFileSync(lockPath, "utf8")).toBe(String(worker.pid));

      let waiting = lock.act(() => "acquired");
      worker.send(shutdown);
      await exited;
      await expect(waiting).resolves.toBe("acquired");
      expect(fs.existsSync(lockPath)).toBe(false);
    },
  );

  it("preserves Vite's asynchronous shutdown after releasing the lock", async () => {
    let worker = startWorker("vite-released");
    let exited = once(worker, "exit");
    await once(worker, "message");
    expect(fs.existsSync(lockPath)).toBe(false);
    worker.send("signal");
    await exited;
    expect(fs.readFileSync(`${lockPath}.result`, "utf8")).toBe("finished");
  });

  it("holds the lock until Vite's shutdown work finishes", async () => {
    let worker = startWorker("vite-held");
    let exited = once(worker, "exit");
    await once(worker, "message");
    let closing = once(worker, "message");
    worker.send("signal");
    expect((await closing)[0]).toBe("closing");
    await expect(
      createLock(lockPath, { timeoutMs: 30 }).act(() => undefined),
    ).rejects.toThrow("Timed out waiting for the typegen lock");
    worker.send("finish");
    await exited;
    expect(fs.readFileSync(`${lockPath}.result`, "utf8")).toBe("finished");
  });

  it.each(["", "2147483647"])(
    "fails with cleanup instructions for an abandoned lock containing %p",
    async (contents) => {
      fs.mkdirSync(path.dirname(lockPath), { recursive: true });
      fs.writeFileSync(lockPath, contents);
      let lock = createLock(lockPath, { timeoutMs: 30 });

      await expect(lock.act(() => undefined)).rejects.toThrow(
        "remove the lock file",
      );
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
