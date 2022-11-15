import fs from "fs";
import path from "path";

import * as cli from "./utils/cli";
import * as git from "./utils/git";
import withApp from "./utils/withApp";

let FIXTURE = path.join(__dirname, "fixtures/replace-remix-magic-imports");

it("checks that project is a clean git repository", async () => {
  await withApp(FIXTURE, async (projectDir) => {
    // ensure project is a git repository
    let error1 = await cli.shouldError([
      "codemod",
      "some-codemod-name",
      projectDir,
    ]);
    expect(error1.exitCode).not.toBe(0);
    expect(error1.stderr).toContain(`${projectDir} is not a git repository`);
    expect(error1.stdout).toContain(
      "To override this safety check, use the --force flag"
    );

    // initialize git repo in project
    await git.initialCommit(projectDir);

    // make some uncommitted changes
    fs.appendFileSync(path.join(projectDir, "package.json"), "change");

    // ensure project has no uncommitted changes
    let error2 = await cli.shouldError([
      "codemod",
      "some-codemod-name",
      projectDir,
    ]);
    expect(error2.exitCode).not.toBe(0);
    expect(error2.stderr).toContain(`${projectDir} has uncommitted changes`);
    expect(error2.stdout).toContain(
      "Stash or commit your changes before running codemods"
    );
    expect(error2.stdout).toContain(
      "To override this safety check, use the --force flag"
    );
  });
});

it("checks that the specified codemod exists", async () => {
  await withApp(FIXTURE, async (projectDir) => {
    await git.initialCommit(projectDir);

    let codemodName = "invalid-codemod-name";
    let error = await cli.shouldError(["codemod", codemodName, projectDir]);
    expect(error.exitCode).toBe(1);
    expect(error.stderr).toContain(`Unrecognized codemod: ${codemodName}`);
  });
});
