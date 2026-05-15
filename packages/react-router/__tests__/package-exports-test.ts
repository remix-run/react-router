/**
 * @jest-environment node
 */

import fs from "node:fs";
import path from "node:path";

type ConditionalExport =
  | string
  | {
      [condition: string]: ConditionalExport;
    };

let packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"),
);

function resolveExport(target: ConditionalExport, conditions: Set<string>) {
  if (typeof target === "string") {
    return target;
  }

  for (let [condition, value] of Object.entries(target)) {
    if (condition === "types") {
      continue;
    }

    if (condition === "default" || conditions.has(condition)) {
      return resolveExport(value, conditions);
    }
  }

  throw new Error(`No export matched conditions: ${[...conditions].join(",")}`);
}

describe("package exports", () => {
  it("defaults legacy entry fields to the production build", () => {
    expect(packageJson.main).toBe("./dist/production/index.js");
    expect(packageJson.module).toBe("./dist/production/index.mjs");
  });

  it.each([
    [".", ["node", "module", "production"], "./dist/production/index.mjs"],
    [".", ["development", "node", "module"], "./dist/development/index.mjs"],
    [".", ["node", "default", "production"], "./dist/production/index.js"],
    [
      "./dom",
      ["node", "module", "production"],
      "./dist/production/dom-export.mjs",
    ],
    [
      "./dom",
      ["development", "node", "module"],
      "./dist/development/dom-export.mjs",
    ],
    [
      "./dom",
      ["node", "default", "production"],
      "./dist/production/dom-export.js",
    ],
    [
      ".",
      ["react-server", "module", "production"],
      "./dist/production/index-react-server.mjs",
    ],
    [
      ".",
      ["development", "react-server", "module"],
      "./dist/development/index-react-server.mjs",
    ],
    [
      "./internal/react-server-client",
      ["react-server", "module", "production"],
      "./dist/production/index-react-server-client.mjs",
    ],
    [
      "./internal/react-server-client",
      ["development", "react-server", "module"],
      "./dist/development/index-react-server-client.mjs",
    ],
  ])("resolves %s for %s", (subpath, conditions, expected) => {
    expect(
      resolveExport(
        packageJson.exports[subpath as keyof typeof packageJson.exports],
        new Set(conditions),
      ),
    ).toBe(expected);
  });
});
