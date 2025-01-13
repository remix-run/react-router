import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const moduleSyncEnabled = require("#module-sync-enabled").default;
export { moduleSyncEnabled };
