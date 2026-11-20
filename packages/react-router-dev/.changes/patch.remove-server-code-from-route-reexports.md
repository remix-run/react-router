Remove server-only code from modules that routes re-export

- Re-exporting route exports from a shared module (`export * from "./shared"` or `export { loader } from "./shared"`) no longer ships the shared module's server code to the browser in dev
- Route exports hidden behind `export * from` are now detected, so re-exported loaders and actions run
