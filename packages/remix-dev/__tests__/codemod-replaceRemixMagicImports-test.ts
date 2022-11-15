import NpmCliPackageJson from "@npmcli/package-json";
import fs from "fs";
import glob from "fast-glob";
import path from "path";
import shell from "shelljs";
import stripAnsi from "strip-ansi";

import { readConfig } from "../config";
import * as cli from "./utils/cli";
import * as eol from "./utils/eol";
import * as git from "./utils/git";
import withApp from "./utils/withApp";

let CODEMOD = "replace-remix-magic-imports";
let FIXTURE = path.join(__dirname, "fixtures/replace-remix-magic-imports");

it("replaces `remix` magic imports", async () => {
  await withApp(FIXTURE, async (projectDir) => {
    await git.initialCommit(projectDir);
    let result = await cli.run(["codemod", CODEMOD, projectDir]);
    let stderr = stripAnsi(result.stderr);
    expect(result.exitCode).toBe(0);

    let successes = [
      `✔ Found codemod: ${CODEMOD}`,
      "✔ No Remix server adapter detected",
      "✔ Detected Remix server runtime: node",
      "✔ Removed magic `remix` package from dependencies",
      "✔ Removed `remix setup` from postinstall script",
      "✔ Replaced magic `remix` imports | 24/24 files",
    ];
    for (let success of successes) {
      expect(stderr).toContain(success);
    }

    expect(result.stdout).toContain(
      "👉 To update your lockfile, run `yarn install`"
    );

    let pkg = await NpmCliPackageJson.load(projectDir);
    let packageJson = pkg.content;

    // check that `remix` dependency was removed
    expect(packageJson.dependencies).not.toContain("remix");
    expect(packageJson.devDependencies).not.toContain("remix");

    // check that Remix packages were standardized
    expect(packageJson.dependencies).toEqual(
      expect.objectContaining({
        "@remix-run/node": "1.3.4",
        "@remix-run/react": "1.3.4",
        "@remix-run/serve": "1.3.4",
      })
    );
    expect(packageJson.devDependencies).toEqual(
      expect.objectContaining({
        "@remix-run/dev": "1.3.4",
      })
    );

    // check that postinstall was removed
    expect(packageJson.scripts).not.toContain("postinstall");

    // check that `from "remix"` magic imports were removed
    let config = await readConfig(projectDir);
    let files = await glob("**/*.{js,jsx,ts,tsx}", {
      cwd: config.appDirectory,
      absolute: true,
    });
    let remixMagicImports = shell.grep("-l", /from ('remix'|"remix")/, files);
    expect(remixMagicImports.code).toBe(0);
    expect(remixMagicImports.stdout.trim()).toBe("");
    expect(remixMagicImports.stderr).toBeNull();

    // check that imports look good for a specific file
    let loginRoute = eol.normalize(
      fs.readFileSync(path.join(projectDir, "app/routes/login.tsx"), "utf8")
    );
    expect(loginRoute).toContain(
      [
        "import {",
        "  type ActionFunction,",
        "  type LoaderFunction,",
        "  type MetaFunction,",
        "  json,",
        "  redirect,",
        '} from "@remix-run/node";',
        'import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";',
      ].join("\n")
    );
  });
});
