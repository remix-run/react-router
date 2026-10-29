import { acquire } from "../../typegen/lock.ts";

process.on("message", () => process.exit(0));
await acquire(process.argv[2]);
process.send("acquired");
