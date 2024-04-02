import { test, expect } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

import { createFixtureProject, js } from "./helpers/create-fixture.js";

test.describe("", () => {
  for (let [serverModuleExt, serverModuleFormat, exportStatement] of [
    ["mjs", "esm", "export {"],
    ["cjs", "cjs", "module.exports ="],
  ]) {
    test(`can write .${serverModuleExt} server output module`, async () => {
      let projectDir = await createFixtureProject({
        compiler: "remix",
        files: {
          // Ensure the config is valid ESM
          "remix.config.js": js`
            export default {
              serverModuleFormat: "${serverModuleFormat}",
              serverBuildPath: "build/index.${serverModuleExt}",
            };
          `,
        },
      });

      let buildPath = path.resolve(
        projectDir,
        "build",
        `index.${serverModuleExt}`
      );
      expect(fs.existsSync(buildPath), "doesn't exist").toBe(true);
      let contents = fs.readFileSync(buildPath, "utf8");
      expect(contents, "no export statement").toContain(exportStatement);
    });
  }
});
