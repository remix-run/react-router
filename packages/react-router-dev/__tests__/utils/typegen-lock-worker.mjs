import fs from "node:fs/promises";
import { asyncExitHook } from "exit-hook";

import { createLock } from "../../typegen/lock.ts";

let [lockPath, mode] = process.argv.slice(2);
let finish;
let pending = new Promise((resolve) => (finish = resolve));
process.on("message", (message) => {
  if (message === "exit") process.exit(0);
  if (message === "signal") {
    process.emit("SIGTERM");
    process.send("signaled");
  }
  if (message === "finish") finish();
});

let action = createLock(lockPath).act(async () => {
  process.send("acquired");
  await pending;
  await fs.writeFile(`${lockPath}.result`, "finished");
});

if (mode === "shutdown") {
  // Keep shutdown pending until the protected write has finished.
  asyncExitHook(() => action, { wait: 30_000 });
}
await action;
