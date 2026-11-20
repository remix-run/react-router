import { createRequire } from "node:module";
const nodeRequire = createRequire(import.meta.url);
const moduleSyncEnabled = nodeRequire("#module-sync-enabled").default;
export { moduleSyncEnabled };
