import { test, expect } from "@playwright/test";

import { isFirefoxMicrotaskWarning } from "./helpers/console.js";
import {
  createFixture,
  createAppFixture,
  js,
} from "./helpers/create-fixture.js";
import { PlaywrightFixture } from "./helpers/playwright-fixture.js";

test("console assertions retain application warnings and errors", async ({
  page,
}) => {
  let fixture = await createFixture({
    files: {
      "app/routes/_index.tsx": js`
        export default function Index() {
          return <h1>Console messages</h1>;
        }
      `,
    },
  });
  let appFixture = await createAppFixture(fixture);
  try {
    let messages: string[] = [];
    page.on("console", (message) => {
      if (!isFirefoxMicrotaskWarning(message)) {
        messages.push(message.text());
      }
    });
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/", true);

    let diagnostic =
      "The execution of microtasks on this page was reordered to avoid unsafe execution.";
    let nativeDiagnostic = `[JavaScript Warning: "${diagnostic}" {file: "${page.url()}" line: 0}]`;
    let unrelatedDiagnostic = nativeDiagnostic.replace(
      diagnostic,
      "Unrelated warning",
    );
    await page.evaluate(
      ({ diagnostic, nativeDiagnostic, unrelatedDiagnostic }) => {
        console.log("Application log");
        console.warn("Application warning");
        console.error("Application error");
        console.warn(diagnostic);
        console.warn(nativeDiagnostic);
        console.error(nativeDiagnostic);
        console.warn(unrelatedDiagnostic);
      },
      { diagnostic, nativeDiagnostic, unrelatedDiagnostic },
    );

    await expect
      .poll(() => messages)
      .toEqual([
        "Application log",
        "Application warning",
        "Application error",
        diagnostic,
        nativeDiagnostic,
        nativeDiagnostic,
        unrelatedDiagnostic,
      ]);
  } finally {
    await appFixture.close();
  }
});
