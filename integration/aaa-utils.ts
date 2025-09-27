import { fileURLToPath } from "node:url";
import * as fs from "node:fs/promises";
import { ChildProcess } from "node:child_process";

import { test as playwrightTest } from "@playwright/test";
import {
  execa,
  ExecaError,
  type Options,
  parseCommandString,
  type ResultPromise,
} from "execa";
import * as Path from "pathe";

declare module "@playwright/test" {
  interface Page {
    errors: Error[];
  }
}

const __filename = fileURLToPath(import.meta.url);
const ROOT = Path.join(__filename, "..");
const TMP = Path.join(ROOT, ".tmp");

type Edit = (
  file: string,
  transform: (contents: string) => string,
) => Promise<void>;

type Command = (
  command: string,
  options?: Pick<Options, "env" | "timeout">,
) => ResultPromise<{ reject: false }> & {
  buffer: { stdout: string; stderr: string };
};

export const testTemplate = (templateName: string) =>
  playwrightTest.extend<{
    cwd: string;
    edit: Edit;
    $: Command;
  }>({
    page: async ({ page }, use) => {
      page.errors = [];
      page.on("pageerror", (error: Error) => page.errors.push(error));
      await use(page);
    },

    // eslint-disable-next-line no-empty-pattern
    cwd: async ({}, use, testInfo) => {
      await fs.mkdir(TMP, { recursive: true });
      const cwd = await fs.mkdtemp(Path.join(TMP, templateName + "-"));
      // await fs.mkdir(cwd, { recursive: true });

      const templateDir = Path.resolve(ROOT, "helpers", templateName);
      await fs.cp(templateDir, cwd, { errorOnExist: true, recursive: true });

      await use(cwd);

      const testPassed = testInfo.errors.length === 0;
      if (!testPassed) console.log("cwd: ", cwd);
    },

    edit: async ({ cwd }, use) => {
      await use(async (file, transform) => {
        const filepath = Path.join(cwd, file);
        const contents = await fs.readFile(filepath, "utf8");
        await fs.writeFile(filepath, transform(contents), "utf8");
        return;
      });
    },

    $: async ({ cwd }, use) => {
      const spawn = execa({
        cwd,
        env: {
          NO_COLOR: "1",
          FORCE_COLOR: "0",
        },
        reject: false,
      });

      let testHasEnded = false;
      const processes: Array<ResultPromise> = [];
      await use((command, options = {}) => {
        const [file, ...args] = parseCommandString(command);

        const p = spawn(file, args, options);
        if (p instanceof ChildProcess) {
          processes.push(p);
        }

        p.then((result) => {
          if (!(result instanceof Error)) return result;

          // Once the test has ended, this process will be killed as part of its teardown resulting in an ExecaError.
          // We only care about surfacing errors that occurred during test execution, not during teardown.
          const expectedError = testHasEnded && result instanceof ExecaError;
          if (expectedError) return result;

          throw result;
        });

        const buffer = { stdout: "", stderr: "" };
        p.stdout.on("data", (data) => (buffer.stdout += data.toString()));
        p.stderr.on("data", (data) => (buffer.stderr += data.toString()));
        return Object.assign(p, { buffer });
      });

      testHasEnded = true;
      processes.forEach((p) => p.kill());
    },
  });
