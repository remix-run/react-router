import fs from "node:fs/promises";
import path from "node:path";

import { createLock } from "../../typegen/lock.ts";

let [lockPath, mode] = process.argv.slice(2);
let finish;
let pending = new Promise((resolve) => (finish = resolve));
process.on("message", (message) => {
  if (message === "exit") process.exit(0);
  if (message === "signal") process.emit("SIGTERM");
  if (message === "finish") finish();
});

if (mode === "vite-released" || mode === "vite-held") {
  let { createServer } = await import("vite");
  let action;
  let server = await createServer({
    root: path.dirname(path.dirname(lockPath)),
    configFile: false,
    logLevel: "silent",
    server: { port: 0 },
    plugins: [
      {
        name: "async-shutdown",
        async closeBundle() {
          if (mode === "vite-held") {
            process.send("closing");
            await pending;
          } else {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          await action;
          await fs.writeFile(`${lockPath}.result`, "finished");
        },
      },
    ],
  });
  await server.listen();
  action = createLock(lockPath).act(async () => {
    if (mode === "vite-held") {
      process.send("acquired");
      await pending;
    }
  });
  await action;
  if (mode === "vite-released") process.send("released");
} else {
  await createLock(lockPath).act(async () => {
    process.send("acquired");
    await pending;
  });
}
