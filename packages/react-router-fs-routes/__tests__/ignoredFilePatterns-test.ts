import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { flatRoutes } from "../flatRoutes";

let appDirectory: string;

beforeEach(() => {
  appDirectory = mkdtempSync(path.join(os.tmpdir(), "ignored-route-patterns-"));
  for (let file of [
    "root.tsx",
    "routes/_index.tsx",
    "routes/about.tsx",
    "routes/draft.test.tsx",
    "routes/.hidden.tsx",
    "routes/.hidden-folder/route.tsx",
    "routes/private/route.tsx",
    "routes/products/route.tsx",
  ]) {
    let filename = path.join(appDirectory, file);
    mkdirSync(path.dirname(filename), { recursive: true });
    writeFileSync(filename, "export default function Route() {}\n");
  }
});

afterEach(() => {
  rmSync(appDirectory, { recursive: true, force: true });
});

test("ignores matching files, folders, and dot entries with minimatch 11", () => {
  let manifest = flatRoutes(appDirectory, ["**/*.test.tsx", "**/private"]);
  expect(Object.keys(manifest).sort()).toEqual([
    "routes/_index",
    "routes/about",
    "routes/products",
  ]);
});

test("comment and empty patterns do not exclude routes", () => {
  let manifest = flatRoutes(appDirectory, ["#comment", ""]);
  expect(Object.keys(manifest).sort()).toEqual([
    "routes/_index",
    "routes/about",
    "routes/draft.test",
    "routes/private",
    "routes/products",
  ]);
});
