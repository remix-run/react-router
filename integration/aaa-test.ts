import { expect } from "@playwright/test";
// import getPort from "get-port";
import { testTemplate } from "./aaa-utils";

const test = testTemplate("vite-6-template");

test("typecheck", async ({ $ }) => {
  await $(`pnpm typecheck`);
  // expect(1).toBe(2);
});
