import { tmpdir } from "os";
import path from "path";
import glob from "fast-glob";
import fs from "fs-extra";

import { readConfig } from "../config";
import * as useJavascript from "../cli/useJavascript";

const FIXTURE = path.join(__dirname, "fixtures", "indie-stack");
const TEMP_DIR = path.join(
  fs.realpathSync(tmpdir()),
  `remix-tests-${Math.random().toString(32).slice(2)}`
);

let makeApp = () => {
  let projectDir = path.join(TEMP_DIR, "convert-to-javascript");
  fs.copySync(FIXTURE, projectDir);
  return projectDir;
};

it("useJavascript converts app code from TS to JS", async () => {
  let projectDir = makeApp();
  await useJavascript.convert(projectDir);

  let config = await readConfig(projectDir);

  // no remix.env.d.ts
  let remixEnvD = path.join(config.appDirectory, "remix.env.d.ts");
  expect(fs.existsSync(remixEnvD)).toBeFalsy();

  // no TS files within app directory
  let TSFiles = glob.sync("**/*.{d.ts,ts,tsx}", {
    cwd: config.appDirectory, // todo: normalize this?
  });
  expect(TSFiles).toHaveLength(0);

  // ensure ESM imports in app directory
  let rootRoute = await fs.readFile(
    path.join(projectDir, "app", "root.jsx"),
    "utf-8"
  );
  expect(rootRoute).not.toContain('require("@remix-run/react")');
});
