import type { Migration } from "../types";
import { replaceRemixImports } from "./replace-remix-imports";

export const migrations: readonly Migration[] = [
  {
    id: "replace-remix-imports",
    description:
      "Replaces `remix` package import statements with specific `@remix-run/*` package import statements.",
    function: replaceRemixImports,
  },
] as const;
