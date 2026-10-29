import { withLock } from "../../typegen/lock.ts";

process.on("message", () => process.exit(0));
await withLock(process.argv[2], async () => {
  process.send("acquired");
  await new Promise(() => {});
});
