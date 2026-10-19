import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const require = createRequire(import.meta.url);
const reporter = fileURLToPath(
  new URL("./reporters/progress.ts", import.meta.url),
);

function runTests(source: string, options = {}) {
  let cwd = mkdtempSync(path.join(tmpdir(), "react-router-reporter-"));
  try {
    writeFileSync(
      path.join(cwd, "playwright.config.cjs"),
      `module.exports = ${JSON.stringify({
        workers: 1,
        retries: 1,
        reporter: [[reporter]],
        ...options,
      })}`,
    );
    writeFileSync(
      path.join(cwd, "fixture.spec.js"),
      `const { test, expect } = require(${JSON.stringify(require.resolve("@playwright/test"))});\n${source}`,
    );
    let result = spawnSync(
      process.execPath,
      [require.resolve("@playwright/test/cli"), "test"],
      { cwd, encoding: "utf8", timeout: 20_000 },
    );
    if (result.error) throw result.error;
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
}

test("progress reporter counts tests once and retains failure diagnostics", () => {
  let { status, output } = runTests(`
    test('passes', () => {
      console.log('test stdout');
      console.error('test stderr');
    });
    test.skip('skips', () => {});
    test('expected failure', () => {
      test.fail();
      expect(1).toBe(2);
    });
    test('flaky', async ({}, info) => {
      expect(info.retry, 'retry failure detail').toBe(1);
    });
    test.describe('terminal', () => {
      test.describe.configure({ retries: 0 });
      test('fails', async ({}, info) => {
        await info.attach('diagnostic', { path: __filename });
        expect('actual', 'terminal failure detail').toBe('expected');
      });
      test('unexpected pass', () => { test.fail(); });
    });
  `);

  expect(status, output).toBe(1);
  expect(output).toContain("Running 6 tests with 1 worker");
  expect(output).toMatch(/6\/6 complete \(100%\).*1 retr(y|ies)/);
  expect(output).not.toContain("7/6");
  expect(output).toContain("RETRY");
  expect(output).toContain("FLAKY");
  expect(output).toContain("retry failure detail");
  expect(output).toContain("terminal failure detail");
  expect(output).toContain("Expected to fail, but passed");
  expect(output).toContain("diagnostic:");
  expect(output).toContain("fixture.spec.js:");
  expect(output).toContain("test stdout");
  expect(output).toContain("test stderr");
  expect(output).toContain("2 passed · 1 skipped · 1 flaky · 2 failed");
});

test("progress reporter logs each 5% milestone once", () => {
  let { status, output } = runTests(`
    for (let i = 0; i < 40; i++) {
      test('case ' + i, () => {});
    }
  `);
  expect(status, output).toBe(0);
  let progress = [...output.matchAll(/(\d+)\/40 complete \((\d+)%\)/g)];
  expect(progress.map((match) => Number(match[1]))).toEqual(
    Array.from({ length: 20 }, (_, i) => (i + 1) * 2),
  );
  expect(progress.map((match) => Number(match[2]))).toEqual(
    Array.from({ length: 20 }, (_, i) => (i + 1) * 5),
  );
  expect(output).toContain("40 passed · 0 failed");
});

test("progress reporter preserves runner errors", () => {
  let { status, output } = runTests(
    `throw new Error('fixture collection failed');`,
  );
  expect(status, output).toBe(1);
  expect(output).toContain("fixture collection failed");
  expect(output).toContain("Run failed");
});

test("progress reporter distinguishes unfinished tests after early termination", () => {
  let { status, output } = runTests(
    `
      test('fails first', () => { throw new Error('stop here'); });
      test('never started', () => {});
    `,
    { retries: 0, maxFailures: 1 },
  );
  expect(status, output).toBe(1);
  expect(output).toContain("1/2 complete (50%)");
  expect(output).toContain("1 not run");
  expect(output).toContain("Run failed");
});

test("progress reporter reports interrupted tests on global timeout", () => {
  let { status, output } = runTests(
    `
      test('interrupted', async () => {
        await new Promise(resolve => setTimeout(resolve, 60_000));
      });
      test('never started', () => {});
    `,
    { globalTimeout: 2_000 },
  );
  expect(status, output).toBe(1);
  expect(output).toContain("0/2 complete (0%)");
  expect(output).not.toContain("1/2 complete");
  // A slow worker may not start before the global deadline. Both active and
  // unstarted tests must stay out of the completion count.
  expect(output).toMatch(/0 failed · (?:1 interrupted · 1 not run|2 not run)/);
  expect(output).toContain("Run timedout");
});
