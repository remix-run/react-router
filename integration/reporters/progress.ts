import * as path from "node:path";

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestError,
  TestResult,
} from "@playwright/test/reporter";

export default class ProgressReporter implements Reporter {
  private tests: TestCase[] = [];
  private completed = new Set<TestCase>();
  private running = new Set<TestCase>();
  private retries = 0;
  private started = Date.now();
  private rootDir = "";
  private quiet = false;
  private lastMilestone = 0;

  onBegin(config: FullConfig, suite: Suite) {
    this.tests = suite.allTests();
    this.started = Date.now();
    this.rootDir = config.rootDir;
    this.quiet = config.quiet;
    console.log(
      `Running ${this.tests.length} tests with ${config.workers} worker${config.workers === 1 ? "" : "s"}`,
    );
  }

  onTestBegin(test: TestCase, result: TestResult) {
    this.running.add(test);
    if (result.retry > 0) this.retries++;
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.running.delete(test);
    let unexpected =
      result.status !== test.expectedStatus &&
      result.status !== "skipped" &&
      result.status !== "interrupted";
    if (unexpected && result.retry < test.retries) {
      console.log(
        `RETRY ${this.title(test)} (retry ${result.retry + 1}/${test.retries})`,
      );
      let error = result.errors[0];
      if (error) console.log(error.message ?? error.value ?? "");
      return;
    }
    if (result.status !== "interrupted") this.completed.add(test);
    if (unexpected) this.failure("FAIL", test, result);
    this.progress();
  }

  onStdOut(chunk: string | Buffer) {
    if (!this.quiet) process.stdout.write(chunk);
  }

  onStdErr(chunk: string | Buffer) {
    if (!this.quiet) process.stderr.write(chunk);
  }

  onError(error: TestError) {
    console.log("ERROR");
    this.error(error);
  }

  onEnd(result: FullResult) {
    let counts = {
      passed: 0,
      skipped: 0,
      flaky: 0,
      failed: 0,
      interrupted: 0,
      "not run": 0,
    };
    // Reconcile at the end: maxFailures or interruption may prevent retries
    // that were still available when onTestEnd ran.
    for (let test of this.tests) {
      let last = test.results.at(-1);
      // On global timeout, active results can still have their initial skipped
      // status: the runner may call onEnd before their onTestEnd callback.
      if (this.running.has(test) || last?.status === "interrupted") {
        counts.interrupted++;
      } else if (!last) {
        counts["not run"]++;
      } else {
        if (test.outcome() === "unexpected" && !this.completed.has(test)) {
          this.failure("FAIL", test, last);
        }
        this.completed.add(test);
        let outcome = test.outcome();
        if (outcome === "expected") counts.passed++;
        else if (outcome === "unexpected") counts.failed++;
        else counts[outcome]++;
        if (outcome === "flaky") {
          for (let attempt of test.results) {
            if (
              attempt.status !== test.expectedStatus &&
              attempt.status !== "skipped"
            ) {
              this.failure("FLAKY", test, attempt);
            }
          }
        }
      }
    }
    this.running.clear();
    this.progress(true);
    console.log(
      Object.entries(counts)
        .filter(([name, count]) => count > 0 || name === "failed")
        .map(([name, count]) => `${count} ${name}`)
        .join(" · "),
    );
    if (result.status !== "passed") console.log(`Run ${result.status}`);
  }

  private progress(final = false) {
    let percent = this.tests.length
      ? Math.floor((this.completed.size / this.tests.length) * 100)
      : 0;
    let milestone = Math.floor(percent / 5);
    // Print 100% with the final summary so it only appears once.
    if (!final && (milestone <= this.lastMilestone || percent === 100)) return;
    this.lastMilestone = milestone;
    let seconds = Math.floor((Date.now() - this.started) / 1000);
    let elapsed = `${Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
    let failed = [...this.completed].filter(
      (test) => test.outcome() === "unexpected",
    ).length;
    console.log(
      `[${elapsed}] ${this.completed.size}/${this.tests.length} complete (${percent}%) | ${failed} failed | ${this.retries} ${this.retries === 1 ? "retry" : "retries"} | ${this.running.size} running`,
    );
  }

  private title(test: TestCase) {
    let location = test.location;
    return `${test.titlePath().filter(Boolean).join(" › ")} (${path.relative(this.rootDir, location.file)}:${location.line}:${location.column})`;
  }

  private failure(label: string, test: TestCase, result: TestResult) {
    console.log(`${label} ${this.title(test)} (attempt ${result.retry + 1})`);
    if (result.status === "passed" && test.expectedStatus === "failed") {
      console.log("Expected to fail, but passed");
    }
    for (let error of result.errors) this.error(error);
    for (let attachment of result.attachments) {
      if (attachment.path)
        console.log(`${attachment.name}: ${attachment.path}`);
    }
  }

  private error(error: TestError) {
    console.log(error.stack ?? error.message ?? error.value ?? "Unknown error");
    if (error.snippet) console.log(error.snippet);
  }
}
