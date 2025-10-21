import { ChildProcess } from "node:child_process";
import * as fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { test as base } from "@playwright/test";
import {
  execa,
  ExecaError,
  type Options,
  parseCommandString,
  type ResultPromise,
} from "execa";
import * as Path from "pathe";

import type { TemplateName } from "./vite.js";

declare module "@playwright/test" {
  interface Page {
    errors: Error[];
  }
}

const __filename = fileURLToPath(import.meta.url);
const ROOT = Path.join(__filename, "../../..");
const TMP = Path.join(ROOT, ".tmp/integration");
const templatePath = (templateName: string) =>
  Path.resolve(ROOT, "integration/helpers", templateName);

type Edits = Record<string, string | ((contents: string) => string)>;

async function applyEdits(cwd: string, edits: Edits) {
  const promises = Object.entries(edits).map(async ([file, transform]) => {
    const filepath = Path.join(cwd, file);
    await fs.writeFile(
      filepath,
      typeof transform === "function"
        ? transform(await fs.readFile(filepath, "utf8"))
        : transform,
      "utf8",
    );
    return;
  });
  await Promise.all(promises);
}

export const test = base.extend<{
  template: TemplateName;
  files: Edits;
  cwd: string;
  edit: (edits: Edits) => Promise<void>;
  $: (
    command: string,
    options?: Pick<Options, "env" | "timeout">,
  ) => ResultPromise<{ reject: false }> & {
    buffer: { stdout: string; stderr: string };
  };
}>({
  template: ["vite-6-template", { option: true }],
  files: [{}, { option: true }],
  page: async ({ page }, use) => {
    page.errors = [];
    page.on("pageerror", (error: Error) => page.errors.push(error));
    await use(page);
  },

  cwd: async ({ template, files }, use, testInfo) => {
    await fs.mkdir(TMP, { recursive: true });
    const cwd = await fs.mkdtemp(Path.join(TMP, template + "-"));
    testInfo.attach("cwd", { body: cwd });

    await fs.cp(templatePath(template), cwd, {
      errorOnExist: true,
      recursive: true,
    });

    await applyEdits(cwd, files);

    await use(cwd);
  },

  edit: async ({ cwd }, use) => {
    await use(async (edits) => applyEdits(cwd, edits));
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
    const unexpectedErrors: Array<Error> = [];

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
        unexpectedErrors.push(result);
      });

      const buffer = { stdout: "", stderr: "" };
      p.stdout?.on("data", (data) => (buffer.stdout += data.toString()));
      p.stderr?.on("data", (data) => (buffer.stderr += data.toString()));
      return Object.assign(p, { buffer });
    });

    testHasEnded = true;
    processes.forEach((p) => p.kill());

    // Throw any unexpected errors that occurred during test execution
    if (unexpectedErrors.length > 0) {
      const errorMessage =
        unexpectedErrors.length === 1
          ? `Unexpected process error: ${unexpectedErrors[0].message}`
          : `${unexpectedErrors.length} unexpected process errors:\n${unexpectedErrors.map((e, i) => `${i + 1}. ${e.message}`).join("\n")}`;

      const error = new Error(errorMessage);
      error.stack = unexpectedErrors[0].stack;
      throw error;
    }
  },
});
