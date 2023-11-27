import * as path from "node:path";
import { test, expect } from "@playwright/test";
import shell from "shelljs";
import glob from "glob";

import { createProject, viteBuild } from "./helpers/vite.js";

let files = {
  "app/utils.server.ts": String.raw`
    export const dotServerFile = "SERVER_ONLY_FILE";
  `,
  "app/.server/utils.ts": String.raw`
    export const dotServerDir = "SERVER_ONLY_DIR";
  `,
};

test("Vite / build / .server file in client fails with expected error", async () => {
  let cwd = await createProject({
    ...files,
    "app/routes/fail-server-file-in-client.tsx": String.raw`
      import { dotServerFile } from "~/utils.server";

      export default function() {
        console.log(dotServerFile);
        return <h1>Fail: Server file included in client</h1>
      }
    `,
  });
  let client = viteBuild({ cwd })[0];
  let stderr = client.stderr.toString("utf8");
  expect(stderr).toMatch(
    `"dotServerFile" is not exported by "app/utils.server.ts"`
  );
});

test("Vite / build / .server dir in client fails with expected error", async () => {
  let cwd = await createProject({
    ...files,
    "app/routes/fail-server-dir-in-client.tsx": String.raw`
      import { dotServerDir } from "~/.server/utils";

      export default function() {
        console.log(dotServerDir);
        return <h1>Fail: Server directory included in client</h1>
      }
    `,
  });
  let client = viteBuild({ cwd })[0];
  let stderr = client.stderr.toString("utf8");
  expect(stderr).toMatch(
    `"dotServerDir" is not exported by "app/.server/utils.ts"`
  );
});

test("Vite / build / dead-code elimination for server exports", async () => {
  let cwd = await createProject({
    ...files,
    "app/routes/remove-server-exports-and-dce.tsx": String.raw`
        import fs from "node:fs";
        import { json } from "@remix-run/node";
        import { useLoaderData } from "@remix-run/react";

        import { dotServerFile } from "../utils.server";
        import { dotServerDir } from "../.server/utils";

        export const loader = () => {
          let contents = fs.readFileSync("blah");
          let data = dotServerFile + dotServerDir + serverOnly + contents;
          return json({ data });
        }

        export const action = () => {
          console.log(dotServerFile, dotServerDir, serverOnly);
          return null;
        }

        export default function() {
          let { data } = useLoaderData<typeof loader>();
          return (
            <>
              <h2>Index</h2>
              <p>{data}</p>
            </>
          );
        }
      `,
  });
  let client = viteBuild({ cwd })[0];
  expect(client.status).toBe(0);

  // detect client asset files
  let assetFiles = glob.sync("**/*.@(js|jsx|ts|tsx)", {
    cwd: path.join(cwd, "build/client"),
    absolute: true,
  });

  // grep for server-only values in client assets
  let result = shell
    .grep("-l", /SERVER_ONLY_FILE|SERVER_ONLY_DIR|node:fs/, assetFiles)
    .stdout.trim()
    .split("\n")
    .filter((line) => line.length > 0);

  expect(result).toHaveLength(0);
});
