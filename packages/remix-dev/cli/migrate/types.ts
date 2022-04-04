import type { Flags } from "./flags";

export type MigrationFunction = (args: {
  projectDir: string;
  flags: Flags;
}) => Promise<void>;

export interface Migration {
  id: string;
  description: string;
  function: MigrationFunction;
}
