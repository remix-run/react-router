import type { Migration } from "../types";
import { convertToJavaScript } from "./convert-to-javascript";
import { replaceRemixImports } from "./replace-remix-imports";

export const migrations: readonly Migration[] = [
  {
    id: "convert-to-javascript",
    description: "Converts your TS project to a JS project",
    function: convertToJavaScript,
  },
  {
    id: "replace-remix-imports",
    description: "Replaces `remix` imports with `@remix-run/*` imports",
    function: replaceRemixImports,
  },
] as const;
