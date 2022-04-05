import type { Migration } from "../types";
import { replaceRemixImports } from "./replace-remix-imports";

export const migrations: readonly Migration[] = [
  {
    id: "replace-remix-imports",
    description: "Replaces `remix` imports with `@remix-run/*` imports",
    function: replaceRemixImports,
  },
] as const;
