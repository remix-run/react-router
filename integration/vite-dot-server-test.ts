import * as path from "node:path";
import { test, expect } from "@playwright/test";
import shell from "shelljs";
import glob from "glob";

import { createProject, viteBuild } from "./helpers/vite.js";

let files = {
  "app/utils.server.ts": String.raw`
    export const dotServerFile = "SERVER_ONLY_FILE";
    export default dotServerFile;
  `,
  "app/.server/utils.ts": String.raw`
    export const dotServerDir = "SERVER_ONLY_DIR";
    export default dotServerDir;
  `,
};

test("Vite / .server file / named import in client fails with expected error", async () => {
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

test("Vite / .server file / namespace import in client fails with expected error", async () => {
  let cwd = await createProject({
    ...files,
    "app/routes/fail-server-file-in-client.tsx": String.raw`
      import * as utils from "~/utils.server";

      export default function() {
        console.log(utils.dotServerFile);
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

test("Vite / .server file / default import in client fails with expected error", async () => {
  let cwd = await createProject({
    ...files,
    "app/routes/fail-server-file-in-client.tsx": String.raw`
      import dotServerFile from "~/utils.server";

      export default function() {
        console.log(dotServerFile);
        return <h1>Fail: Server file included in client</h1>
      }
    `,
  });
  let client = viteBuild({ cwd })[0];
  let stderr = client.stderr.toString("utf8");
  expect(stderr).toMatch(`"default" is not exported by "app/utils.server.ts"`);
});

test("Vite / .server dir / named import in client fails with expected error", async () => {
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

test("Vite / .server dir / namespace import in client fails with expected error", async () => {
  let cwd = await createProject({
    ...files,
    "app/routes/fail-server-dir-in-client.tsx": String.raw`
      import * as utils from "~/.server/utils";

      export default function() {
        console.log(utils.dotServerDir);
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

test("Vite / .server dir / default import in client fails with expected error", async () => {
  let cwd = await createProject({
    ...files,
    "app/routes/fail-server-dir-in-client.tsx": String.raw`
      import dotServerDir from "~/.server/utils";

      export default function() {
        console.log(dotServerDir);
        return <h1>Fail: Server directory included in client</h1>
      }
    `,
  });
  let client = viteBuild({ cwd })[0];
  let stderr = client.stderr.toString("utf8");
  expect(stderr).toMatch(`"default" is not exported by "app/.server/utils.ts"`);
});

test("Vite / `handle` with dynamic imports as an escape hatch for server-only code", async () => {
  let cwd = await createProject({
    ...files,
    "app/routes/handle-server-only.tsx": String.raw`
      export const handle = {
        // Sharp knife alert: you probably should avoid doing this, but you can!
        serverOnlyEscapeHatch: async () => {
          let { dotServerFile } = await import("~/utils.server");
          let dotServerDir = await import("~/.server/utils");
          return { dotServerFile, dotServerDir };
        }
      }

      export default function() {
        return <h1>This should work</h1>
      }
    `,
  });
  let [client, server] = viteBuild({ cwd });
  expect(client.status).toBe(0);
  expect(server.status).toBe(0);

  let lines = grep(
    path.join(cwd, "build/client"),
    /SERVER_ONLY_FILE|SERVER_ONLY_DIR/
  );
  expect(lines).toHaveLength(0);
});

test("Vite / dead-code elimination for server exports", async () => {
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
  let [client, server] = viteBuild({ cwd });
  expect(client.status).toBe(0);
  expect(server.status).toBe(0);

  let lines = grep(
    path.join(cwd, "build/client"),
    /SERVER_ONLY_FILE|SERVER_ONLY_DIR|node:fs/
  );
  expect(lines).toHaveLength(0);
});

function grep(cwd: string, pattern: RegExp): string[] {
  let assetFiles = glob.sync("**/*.@(js|jsx|ts|tsx)", {
    cwd,
    absolute: true,
  });

  let lines = shell
    .grep("-l", pattern, assetFiles)
    .stdout.trim()
    .split("\n")
    .filter((line) => line.length > 0);
  return lines;
}
