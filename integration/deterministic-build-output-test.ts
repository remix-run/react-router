import { test, expect } from "@playwright/test";
import globby from "globby";
import fs from "fs";
import path from "path";

import { createFixtureProject } from "./helpers/create-fixture";

test("builds deterministically under different paths", async () => {
  let dir1 = await createFixtureProject();
  let dir2 = await createFixtureProject();

  expect(dir1).not.toEqual(dir2);

  let files1 = await globby(["build/index.js", "public/build/**/*.js"], {
    cwd: dir1,
  });
  let files2 = await globby(["build/index.js", "public/build/**/*.js"], {
    cwd: dir2,
  });

  expect(files1.length).toBeGreaterThan(0);
  expect(files1).toEqual(files2);
  files1.forEach((file, i) => {
    expect(fs.readFileSync(path.join(dir1, file))).toEqual(
      fs.readFileSync(path.join(dir2, files2[i]))
    );
  });
});
