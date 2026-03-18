# Jest → Vitest Migration Plan

This document is the complete, self-contained guide for migrating the React Router
repo from Jest to Vitest. All patterns were validated hands-on in
`packages/react-router` before writing this plan.

---

## Scope

8 packages have Jest test suites:

| Package | Test files | Notes |
|---|---|---|
| `react-router` | ~105 | jsdom env, snapshots, `getWindow` utility, 8 node-env files |
| `react-router-dev` | 6 | node env only (no DOM) |
| `react-router-express` | 1 | node env, `jest.mock()` + `jest.requireActual()` |
| `react-router-node` | 1 | node env |
| `react-router-fs-routes` | 2 | node env |
| `react-router-architect` | 2 | node env, `jest.mock()` + `jest.requireActual()` |
| `create-react-router` | 1 | node env, `jest.mock()` + MSW |
| `react-router-remix-routes-option-adapter` | 2 | node env |

After migration, `jest/`, `jest/jest.config.shared.js`, `jest/transform.js`, and
all per-package `jest.config.js` files can be deleted, along with Jest and Babel
dependencies in the root `package.json`.

---

## Step 1 — Install Vitest

Add to the **root** `package.json` devDependencies (workspace-level so all packages
can resolve it):

```json
"vitest": "^4.x",
"@vitest/coverage-v8": "^4.x"
```

Each package that needs `@testing-library/jest-dom` matchers must also have:
```json
"@testing-library/jest-dom": "^6.x"
```
(already present in `react-router`; check others)

Run `pnpm install`.

---

## Step 2 — Add `vitest.config.ts` to each package

### Packages with a jsdom test environment (`react-router`)

```ts
// packages/react-router/vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  esbuild: {
    // Automatic JSX transform — no `import React` needed in test files
    jsx: "automatic",
  },
  define: {
    // Matches the Jest global set in jest/jest.config.shared.js
    __DEV__: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        // Vitest jsdom defaults to about:blank; same-origin link checks need
        // a real origin to match against.
        url: "http://localhost/",
      },
    },
    include: ["**/*-test.[jt]s?(x)"],
    setupFiles: [
      "__tests__/setup.ts",
      // Provides .toBeInTheDocument() etc. globally via vitest's expect
      "@testing-library/jest-dom/vitest",
    ],
    alias: {
      // Mirror the moduleNameMapper in jest/jest.config.shared.js
      "react-router": path.resolve(__dirname, "index.ts"),
    },
  },
});
```

### Packages with a node-only test environment

```ts
// packages/react-router-express/vitest.config.ts  (and similar)
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  define: {
    __DEV__: true,
  },
  test: {
    globals: true,
    environment: "node",
    include: ["**/*-test.[jt]s?(x)"],
    alias: {
      // Add whichever aliases the package needs from jest.config.shared.js
      "react-router": path.resolve(__dirname, "../react-router/index.ts"),
      "@react-router/node": path.resolve(__dirname, "../react-router-node/index.ts"),
    },
  },
});
```

Adjust the `alias` map per-package to match what was in `jest.config.shared.js`'s
`moduleNameMapper`.

### Packages with a `setupFilesAfterEnv`

`react-router-dev` and `create-react-router` use a `setupAfterEnv.ts`. In Vitest
this is just `setupFiles` — there is no `setupFilesAfterEnv` distinction. Add the
file to the `setupFiles` array.

---

## Step 3 — Update `package.json` scripts

In each package, replace the Jest test script with Vitest:

```json
// Before
"test": "jest"

// After
"test:vitest": "vitest run",
"test:vitest:watch": "vitest"
```

The root `package.json` currently runs `jest` for the monorepo. Update it to run
`vitest run` per-package (or configure a root `vitest.workspace.ts`).

---

## Step 4 — Fix `getWindow.ts` (react-router only)

`packages/react-router/__tests__/utils/getWindow.ts` imports `jsdom` directly.
Vite's import analysis cannot resolve CJS-only packages like `jsdom`, so a
static `import { JSDOM } from "jsdom"` will fail with:

> `Failed to resolve import "jsdom" from "__tests__/utils/getWindow.ts"`

**Fix:** use `createRequire` to load it via Node's native CJS loader, which
bypasses Vite's import analysis.

Also: jsdom 22 always wires a default `jsdomError` listener on every `JSDOM()`
instance that forwards to `console.error`. Tests that intentionally do NOT call
`event.preventDefault()` (external links, `reloadDocument`, right-click, modifier
keys) will trigger "Not implemented: navigation" noise unless you provide a custom
`VirtualConsole`. The third parameter `ignoreNavigationErrors` opts into that
suppression.

Replace the entire file:

```ts
// packages/react-router/__tests__/utils/getWindow.ts
import { createRequire } from "module";

// Use createRequire to load jsdom via Node's native CJS loader, bypassing
// Vite's import analysis which can't resolve jsdom's CJS-only package.
const require = createRequire(import.meta.url);
const { JSDOM, VirtualConsole } = require("jsdom") as typeof import("jsdom");

export default function getWindow(
  initialUrl: string,
  isHash = false,
  ignoreNavigationErrors = false,
): Window {
  let virtualConsole: InstanceType<typeof VirtualConsole> | undefined;
  if (ignoreNavigationErrors) {
    virtualConsole = new VirtualConsole();
    virtualConsole.on("jsdomError", (error: Error) => {
      if (!error.message.startsWith("Not implemented: navigation")) {
        console.error(error);
      }
    });
  }

  // Need to use our own custom DOM in order to get a working history
  const dom = new JSDOM(`<!DOCTYPE html>`, {
    url: "http://localhost/",
    ...(virtualConsole && { virtualConsole }),
  });
  dom.window.history.replaceState(null, "", (isHash ? "#" : "") + initialUrl);
  return dom.window as unknown as Window;
}
```

**Which tests need `ignoreNavigationErrors = true`?**
Any test that renders `<Link>`/`<NavLink>`/`<a>` and intentionally lets the browser
navigate (i.e., asserts `event.defaultPrevented === false`). Currently:

- `__tests__/dom/link-click-test.tsx` — pass `getWindow("/", false, true)` in
  `beforeEach`

---

## Step 5 — Convert every test file

### 5a — Universal find/replace (safe to do mechanically)

| Find | Replace |
|---|---|
| `jest.fn()` | `vi.fn()` |
| `jest.spyOn(` | `vi.spyOn(` |
| `jest.clearAllMocks()` | `vi.clearAllMocks()` |
| `jest.resetAllMocks()` | `vi.resetAllMocks()` |
| `jest.restoreAllMocks()` | `vi.restoreAllMocks()` |
| `jest.useFakeTimers()` | `vi.useFakeTimers()` |
| `jest.runAllTimers()` | `vi.runAllTimers()` |
| `jest.useRealTimers()` | `vi.useRealTimers()` |
| `jest.advanceTimersByTime(` | `vi.advanceTimersByTime(` |
| `/** @jest-environment node */` | `// @vitest-environment node` |
| `import "@testing-library/jest-dom";` | _(delete — handled by setupFiles)_ |
| `import * as React from "react";` | _(delete — automatic JSX handles it)_ |

> **Note on multiline patterns**: `jest.spyOn(` sometimes spans multiple lines
> (e.g., `jest\n  .spyOn(...)`). Scan for `jest\n` with a multiline regex or grep
> to catch these.

### 5b — Add vitest imports to every file

Every converted file needs:
```ts
import { describe, expect, it, vi, beforeEach, afterEach, beforeAll, afterAll, test } from "vitest";
```

Only import what's used. Files using `globals: true` can skip this, but explicit
imports are cleaner and work without globals.

### 5c — Type annotations

| Find | Replace |
|---|---|
| `jest.SpyInstance<R, P>` | `ReturnType<typeof vi.spyOn<T, "methodName">>` |
| `jest.MockedFunction<typeof fn>` | `vi.MockedFunction<typeof fn>` |
| `jest.Mocked<T>` | `vi.Mocked<T>` |
| `declare global { namespace jest { interface Matchers...` | `declare module "vitest" { interface Assertion<T>... interface AsymmetricMatchersContaining...` |

Custom matcher type augmentation pattern:
```ts
// Before (Jest)
declare global {
  namespace jest {
    interface Matchers<R> extends CustomMatchers<R> {}
  }
}

// After (Vitest)
declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
```

### 5d — `jest.mock()` + `jest.requireActual()` (express, architect, create-react-router)

```ts
// Before
jest.mock("react-router", () => {
  let original = jest.requireActual("react-router");
  return { ...original, createRequestHandler: jest.fn() };
});
let mocked = createRequestHandler as jest.MockedFunction<typeof createRequestHandler>;

// After
vi.mock("react-router", async () => {
  let original = await vi.importActual("react-router");
  return { ...original, createRequestHandler: vi.fn() };
});
let mocked = createRequestHandler as vi.MockedFunction<typeof createRequestHandler>;
```

Key differences:
- `vi.mock()` factory is **async** — add `async` and `await vi.importActual()`
- `jest.fn()` inside the factory → `vi.fn()`
- `vi.mock()` calls are hoisted automatically (same as Jest)

---

## Step 6 — Per-file edge cases (react-router)

### `MouseEvent` with `view: window`

Remove `view: window` from any `MouseEvent` constructor:
```ts
// Before
new MouseEvent("click", { bubbles: true, cancelable: true, view: window })

// After
new MouseEvent("click", { bubbles: true, cancelable: true })
```
Vitest's jsdom doesn't satisfy `instanceof Window` for the `view` field check.

### `link-click-test.tsx` — render into getWindow document

This file renders anchors and tests that some clicks do NOT prevent default.
Without isolation, jsdom's navigation warning fires on the global console.
Use a fresh `getWindow` document as the render target:

```ts
// Before
let node: HTMLDivElement;
beforeEach(() => {
  node = document.createElement("div");
  document.body.appendChild(node);
});
afterEach(() => {
  document.body.removeChild(node);
});

// After
let testWindow: Window;
let node: HTMLDivElement;
beforeEach(() => {
  testWindow = getWindow("/", false, true);   // ignoreNavigationErrors = true
  node = testWindow.document.createElement("div");
  testWindow.document.body.appendChild(node);
});
afterEach(() => {
  testWindow.document.body.removeChild(node);
});
```

### Fake timers — always restore after use

If a `beforeEach` calls `vi.useFakeTimers()`, it **must** be paired with
`afterEach(() => vi.useRealTimers())`. Missing cleanup leaks fake timers into
subsequent tests.

```ts
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();   // ← required; was missing in components-test.tsx
});
```

### Inline snapshots with variable interpolation

Vitest does **not** support `${variable}` inside `toMatchInlineSnapshot` template
literals. Convert to explicit assertions:

```ts
// Before (Jest only)
// eslint-disable-next-line jest/no-interpolation-in-snapshots
expect(renderer.toJSON()).toMatchInlineSnapshot(`
  [<p>${JSON.stringify(params)}</p>, <p>${url}</p>, <p>${url}</p>]
`);

// After
let json = renderer.toJSON() as TestRenderer.ReactTestInstance[];
expect(json[0].children?.[0]).toBe(JSON.stringify(params));
expect(json[1].children?.[0]).toBe(url);
expect(json[2].children?.[0]).toBe(url);
```

### File-based snapshots (`.snap` files)

Vitest uses "Vitest Snapshot v1" format; Jest uses "Jest Snapshot v1". On first run,
Vitest writes new snapshot keys alongside the old Jest-format keys, which are then
reported as **obsolete**. Tests still pass. Run with `--update` once to remove the
stale keys:

```sh
npx vitest run --update
```

Affected file: `__tests__/__snapshots__/route-matching-test.tsx.snap`

### `@jest-environment node` → `@vitest-environment node`

Files using the node environment override use a comment directive:

```ts
// Before (must be in a /** */ block)
/**
 * @jest-environment node
 */

// After (single-line comment)
// @vitest-environment node
```

Files needing this in `react-router`:
- `__tests__/server-runtime/actions-test.ts`
- `__tests__/server-runtime/server-test.ts`
- `__tests__/server-runtime/cookies-test.ts`
- `__tests__/server-runtime/sessions-test.ts`
- `__tests__/dom/data-static-router-test.tsx`
- `__tests__/data-router-no-dom-test.tsx`
- `__tests__/router/ssr-test.ts`
- `__tests__/router/router-memory-test.ts`

And in `react-router-node`:
- `__tests__/sessions-test.ts`

### `import.meta` usage

Jest's Babel transform replaced `import.meta` with `undefined`. Vitest natively
supports `import.meta.env`, `import.meta.url`, etc., so no shim is needed. Remove
any workarounds for this that may exist in test utilities.

---

## Step 7 — Node.js deprecation warnings

`jsdom 22` imports Node's built-in `punycode` module (via `whatwg-url`), which
Node 21+ deprecates. This prints one warning per Vitest worker process. It is fixed
in jsdom 25+. Until then, suppress with:

```sh
NODE_NO_WARNINGS=1 npx vitest run
```

Or add to the npm script:
```json
"test:vitest": "NODE_NO_WARNINGS=1 vitest run"
```

---

## Step 8 — Clean up Jest infrastructure

Once all packages are green on Vitest:

1. Delete `jest/` directory
2. Delete all `packages/*/jest.config.js` files
3. Remove from root `package.json` devDependencies:
   - `jest`, `jest-environment-jsdom`, `babel-jest`
   - `@babel/core`, `@babel/preset-env`, `@babel/preset-react`, `@babel/preset-typescript`
   - `babel-plugin-dev-expression`
   - `@types/jest`
4. Update the root `package.json` `"test"` script
5. Run `pnpm install`

---

## Quick reference — what changed in already-converted files

The following files in `packages/react-router` have already been converted and can
serve as concrete examples:

| File | Key patterns demonstrated |
|---|---|
| `__tests__/href-test.ts` | Minimal: add vitest import |
| `__tests__/router/create-path-test.ts` | Minimal: add vitest import |
| `__tests__/router/route-fallback-test.ts` | Custom matcher type augmentation, `vi.fn()`, `vi.spyOn()` |
| `__tests__/createRoutesFromChildren-test.tsx` | JSX inline snapshots |
| `__tests__/dom/link-click-test.tsx` | `getWindow` for render target, `ignoreNavigationErrors` |
| `__tests__/dom/fetcher-submit-tagname-test.tsx` | Remove React import, `vi.fn()` |
| `__tests__/server-runtime/responses-test.ts` | `@vitest-environment node` directive |
| `__tests__/dom/use-prompt-test.tsx` | `vi.clearAllMocks()`, `vi.spyOn()` multiline replacement |
| `__tests__/useParams-test.tsx` | `vi.spyOn` type annotation, inline snapshot with interpolation → explicit assertions |
| `__tests__/route-matching-test.tsx` | File-based snapshot regeneration |
| `__tests__/dom/ssr/components-test.tsx` | Fake timers + `afterEach(vi.useRealTimers)` |
| `__tests__/dom/scroll-restoration-test.tsx` | `getWindow` with non-`/` path |
| `__tests__/dom/nav-link-active-test.tsx` | `getWindow` with jsdom navigation |
| `vitest.config.ts` | Complete working config for the package |
| `__tests__/utils/getWindow.ts` | `createRequire` fix + `VirtualConsole` + `ignoreNavigationErrors` |
