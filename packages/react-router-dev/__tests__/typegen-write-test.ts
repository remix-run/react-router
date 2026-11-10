import { jest } from "@jest/globals";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createLock } from "../typegen/lock";

jest.unstable_mockModule("../typegen/context", () => ({
  createContext: async ({ rootDirectory }: { rootDirectory: string }) => ({
    rootDirectory,
  }),
}));
jest.unstable_mockModule("../typegen/generate", () => ({
  typesDirectory: ({ rootDirectory }: { rootDirectory: string }) =>
    path.join(rootDirectory, ".react-router", "types"),
  generateServerBuild: ({ rootDirectory }: { rootDirectory: string }) => ({
    filename: path.join(rootDirectory, ".react-router", "types", "slow.ts"),
    content: "pending write",
  }),
  generateRoutes: ({ rootDirectory }: { rootDirectory: string }) => [
    {
      filename: path.join(rootDirectory, ".react-router", "types", "failed.ts"),
      content: "failed write",
    },
  ],
}));

let { run } = await import("../typegen/index");

it("holds the typegen lock until sibling writes settle after a failure", async () => {
  let root = fs.mkdtempSync(path.join(os.tmpdir(), "rr-typegen-write-"));
  let lockPath = path.join(root, ".react-router", ".typegen.lock");
  let error = new Error("write failed");
  let finish!: () => void;
  let pending = new Promise<void>((resolve) => (finish = resolve));
  let started!: () => void;
  let writing = new Promise<void>((resolve) => (started = resolve));
  let writeFile = fsp.writeFile;
  jest.spyOn(fsp, "writeFile").mockImplementation(async (filename, content) => {
    if (path.basename(String(filename)) === "failed.ts") {
      await writing;
      throw error;
    }
    started();
    await pending;
    await writeFile(filename, content);
  });
  // Handle the rejection immediately, including with the fail-fast implementation.
  let result = run(root, { mode: "development", rsc: false }).catch(
    (reason) => reason,
  );

  try {
    await writing;
    await expect(
      createLock(lockPath, { timeoutMs: 30 }).act(() => undefined),
    ).rejects.toThrow("Timed out waiting for the typegen lock");
    finish();
    await expect(result).resolves.toBe(error);
    expect(fs.existsSync(lockPath)).toBe(false);
    expect(
      fs.readFileSync(path.join(root, ".react-router/types/slow.ts"), "utf8"),
    ).toBe("pending write");
  } finally {
    finish();
    await result;
    jest.restoreAllMocks();
    fs.rmSync(root, { recursive: true, force: true });
  }
});
