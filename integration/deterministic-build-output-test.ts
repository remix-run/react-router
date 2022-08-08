import { test, expect } from "@playwright/test";
import globby from "globby";
import fs from "fs";
import path from "path";

import { createFixtureProject, js } from "./helpers/create-fixture";

test("builds deterministically under different paths", async () => {
  // This test validates various flavors of remix virtual modules to ensure
  // we get identical builds regardless of the parent paths. If a virtual
  // module resolves or imports from absolute paths (e.g. via `path.resolve`),
  // the build hashes may change even though the output is identical. This
  // can cause broken apps (i.e. manifest mismatch) if the server and client
  // are built separately.

  // Virtual modules tested:
  //  * browserRouteModulesPlugin (implicitly tested by root route)
  //  * emptyModulesPlugin (via app/routes/foo.tsx' server import)
  //  * mdx (via app/routes/index.mdx)
  //  * serverAssetsManifestPlugin (implicitly tested by build)
  //  * serverEntryModulePlugin (implicitly tested by build)
  //  * serverRouteModulesPlugin (implicitly tested by build)
  let init = {
    files: {
      "app/routes/index.mdx": "# hello world",
      "app/routes/foo.tsx": js`
        export * from "~/foo/bar.server";
        export default () => "YAY";
      `,
      "app/foo/bar.server.ts": "export const meta = () => []",
    },
  };
  let dir1 = await createFixtureProject(init);
  let dir2 = await createFixtureProject(init);

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
