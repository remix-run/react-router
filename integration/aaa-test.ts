import { expect } from "@playwright/test";
// import getPort from "get-port";
import { testTemplate } from "./aaa-utils";

const test = testTemplate("vite-6-template");

test("typecheck", async ({ $, edit }) => {
  await $(`pnpm typecheck`);
  await edit("app/root.tsx", (code) => code + "\n\n const a: string = 1");
  const typecheck = await $(`pnpm typecheck`, { reject: false });
  expect(typecheck.exitCode).toBe(2);
  expect(typecheck.stdout).toContain(
    "app/root.tsx(22,8): error TS2322: Type 'number' is not assignable to type 'string'.",
  );
});
