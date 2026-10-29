import { createLock } from "../../typegen/lock.ts";

process.on("message", () => process.exit(0));
let lock = createLock(process.argv[2]);
await lock.act(async () => {
  process.send("acquired");
  await new Promise(() => {});
});
