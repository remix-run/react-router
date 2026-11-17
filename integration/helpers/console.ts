import type { ConsoleMessage } from "@playwright/test";

export function isFirefoxMicrotaskWarning(message: ConsoleMessage) {
  let location = message.location();
  // Firefox emits this native diagnostic when safely resolving a Web API
  // promise requires another microtask. It is not an application console call.
  // https://firefox-source-docs.mozilla.org/dom/promise/safe-promise-resolve.html
  return (
    message.page()?.context().browser()?.browserType().name() === "firefox" &&
    message.type() === "warning" &&
    location.lineNumber === 0 &&
    message.text() ===
      `[JavaScript Warning: "The execution of microtasks on this page was reordered to avoid unsafe execution." {file: "${location.url}" line: 0}]`
  );
}
