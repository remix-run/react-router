import type { Flags } from "./flags";

export type MigrationFunction = (
  projectDir: string,
  flags?: Flags
) => Promise<void>;
