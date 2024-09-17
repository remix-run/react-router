import dedent from "dedent";

import type { Cache } from "./cache";
import {
  hasChunkableExport,
  getChunkedExport,
  omitChunkedExports,
} from "./route-chunks";

let cache: [Cache, string] = [new Map(), "cacheKey"];

describe("route chunks", () => {
  describe("chunkable", () => {
    test("functions with no identifiers", () => {
      const code = dedent`
        export default function () { return null; }
        export function target1() { return null; }
        export function other1() { return null; }
        export const target2 = () => null;
        export const other2 = () => null;
      `;
      expect(hasChunkableExport(code, "default", ...cache)).toBe(true);
      expect(hasChunkableExport(code, "target1", ...cache)).toBe(true);
      expect(hasChunkableExport(code, "target2", ...cache)).toBe(true);
      expect(getChunkedExport(code, "default", {}, ...cache)?.code)
        .toMatchInlineSnapshot(`
        "export default function () {
          return null;
        }"
      `);
      expect(getChunkedExport(code, "target1", {}, ...cache)?.code)
        .toMatchInlineSnapshot(`
        "export function target1() {
          return null;
        }"
      `);
      expect(
        getChunkedExport(code, "target2", {}, ...cache)?.code
      ).toMatchInlineSnapshot(`"export const target2 = () => null;"`);
      expect(
        omitChunkedExports(
          code,
          ["default", "target1", "target2"],
          {},
          ...cache
        )?.code
      ).toMatchInlineSnapshot(`
        "export function other1() {
          return null;
        }
        export const other2 = () => null;"
      `);
    });

    test("functions referencing their own identifiers", () => {
      const code = dedent`
        import defaultMessage, {
          targetMessage1,
          targetMessage2,
          otherMessage1,
          otherMessage2,
        } from "./messages";
        import * as messages from "./messages"; 

        const getDefaultMessage = () => defaultMessage;
        const getTargetMessage1 = () => targetMessage1;
        const getOtherMessage1 = () => otherMessage1;
        function getTargetMessage2() { return targetMessage2; }
        function getOtherMessage2() { return otherMessage2; }
        function getNamespacedMessage() { return messages.namespacedMessage; }

        export default function() { return getDefaultMessage(); }
        export function namespaced() { getNamespacedMessage(); }
        export function target1() { return getTargetMessage1(); }
        export function other1() { return getOtherMessage1(); }
        export const target2 = () => getTargetMessage2();
        export const other2 = () => getOtherMessage2();
      `;
      expect(hasChunkableExport(code, "default", ...cache)).toBe(true);
      expect(hasChunkableExport(code, "namespaced", ...cache)).toBe(true);
      expect(hasChunkableExport(code, "target1", ...cache)).toBe(true);
      expect(hasChunkableExport(code, "target2", ...cache)).toBe(true);
      expect(getChunkedExport(code, "default", {}, ...cache)?.code)
        .toMatchInlineSnapshot(`
        "import defaultMessage from "./messages";
        const getDefaultMessage = () => defaultMessage;
        export default function () {
          return getDefaultMessage();
        }"
      `);
      expect(getChunkedExport(code, "namespaced", {}, ...cache)?.code)
        .toMatchInlineSnapshot(`
        "import * as messages from "./messages";
        function getNamespacedMessage() {
          return messages.namespacedMessage;
        }
        export function namespaced() {
          getNamespacedMessage();
        }"
      `);
      expect(getChunkedExport(code, "target1", {}, ...cache)?.code)
        .toMatchInlineSnapshot(`
        "import { targetMessage1 } from "./messages";
        const getTargetMessage1 = () => targetMessage1;
        export function target1() {
          return getTargetMessage1();
        }"
      `);
      expect(getChunkedExport(code, "target2", {}, ...cache)?.code)
        .toMatchInlineSnapshot(`
        "import { targetMessage2 } from "./messages";
        function getTargetMessage2() {
          return targetMessage2;
        }
        export const target2 = () => getTargetMessage2();"
      `);
      expect(
        omitChunkedExports(
          code,
          ["default", "target1", "target2", "namespaced"],
          {},
          ...cache
        )?.code
      ).toMatchInlineSnapshot(`
        "import { otherMessage1, otherMessage2 } from "./messages";
        const getOtherMessage1 = () => otherMessage1;
        function getOtherMessage2() {
          return otherMessage2;
        }
        export function other1() {
          return getOtherMessage1();
        }
        export const other2 = () => getOtherMessage2();"
      `);
    });
  });

  describe("partially chunkable", () => {
    test("function with no identifiers, one with shared identifiers", () => {
      const code = dedent`
      import defaultMessage, { target1Message } from "./messages";
      import { sharedMessage } from "./sharedMessage";

      const getDefaultMessage = () => defaultMessage;
      const getTarget1Message = () => target1Message;
      const getSharedMessage = () => sharedMessage;

      export default function () { return getDefaultMessage(); }
      export function target1() { return getTarget1Message(); }
      export const target2 = () => getSharedMessage();
      export const other1 = () => getSharedMessage();
      export const other2 = () => getSharedMessage();
    `;
      expect(hasChunkableExport(code, "default", ...cache)).toBe(true);
      expect(hasChunkableExport(code, "target1", ...cache)).toBe(true);
      expect(hasChunkableExport(code, "target2", ...cache)).toBe(false);
      expect(getChunkedExport(code, "default", {}, ...cache)?.code)
        .toMatchInlineSnapshot(`
        "import defaultMessage from "./messages";
        const getDefaultMessage = () => defaultMessage;
        export default function () {
          return getDefaultMessage();
        }"
      `);
      expect(getChunkedExport(code, "target1", {}, ...cache)?.code)
        .toMatchInlineSnapshot(`
        "import { target1Message } from "./messages";
        const getTarget1Message = () => target1Message;
        export function target1() {
          return getTarget1Message();
        }"
      `);
      expect(getChunkedExport(code, "target2", {}, ...cache)).toBeUndefined();
      expect(
        omitChunkedExports(
          code,
          ["default", "target1", "target2"],
          {},
          ...cache
        )?.code
      ).toMatchInlineSnapshot(`
        "import { sharedMessage } from "./sharedMessage";
        const getSharedMessage = () => sharedMessage;
        export const target2 = () => getSharedMessage();
        export const other1 = () => getSharedMessage();
        export const other2 = () => getSharedMessage();"
      `);
    });

    test("function referencing its own identifiers, another one sharing an identifier", () => {
      const code = dedent`
        import { targetMessage1 } from "./targetMessage1";
        import { sharedMessage } from "./sharedMessage";

        const getTargetMessage1 = () => targetMessage1;
        const getOtherMessage1 = () => sharedMessage;
        function getTargetMessage2() { return sharedMessage; }
        function getOtherMessage2() { return sharedMessage; }

        export function target1() { return getTargetMessage1(); }
        export function other1() { return getOtherMessage1(); }
        export const target2 = () => getTargetMessage2();
        export const other2 = () => getOtherMessage2();
      `;
      expect(hasChunkableExport(code, "target1", ...cache)).toBe(true);
      expect(hasChunkableExport(code, "target2", ...cache)).toBe(false);
      expect(getChunkedExport(code, "target1", {}, ...cache)?.code)
        .toMatchInlineSnapshot(`
        "import { targetMessage1 } from "./targetMessage1";
        const getTargetMessage1 = () => targetMessage1;
        export function target1() {
          return getTargetMessage1();
        }"
      `);
      expect(getChunkedExport(code, "target2", {}, ...cache)).toBeUndefined();
      expect(
        omitChunkedExports(code, ["target1", "target2"], {}, ...cache)?.code
      ).toMatchInlineSnapshot(`
        "import { sharedMessage } from "./sharedMessage";
        const getOtherMessage1 = () => sharedMessage;
        function getTargetMessage2() {
          return sharedMessage;
        }
        function getOtherMessage2() {
          return sharedMessage;
        }
        export function other1() {
          return getOtherMessage1();
        }
        export const target2 = () => getTargetMessage2();
        export const other2 = () => getOtherMessage2();"
      `);
    });
  });

  describe("not chunkable", () => {
    test("exports not present", () => {
      const code = dedent`
        export default function () {}
      `;
      expect(hasChunkableExport(code, "target1", ...cache)).toBe(false);
      expect(getChunkedExport(code, "target1", {}, ...cache)).toBeUndefined();
      expect(hasChunkableExport(code, "target2", ...cache)).toBe(false);
      expect(getChunkedExport(code, "target2", {}, ...cache)).toBeUndefined();
      expect(
        omitChunkedExports(code, ["target1", "target2"], {}, ...cache)?.code
      ).toMatchInlineSnapshot(`"export default function () {}"`);
    });

    test("functions sharing a variable", () => {
      const code = dedent`
        const sharedMessage = "shared";
        const getTargetMessage1 = () => sharedMessage;
        const getTargetMessage2 = () => sharedMessage;
        const getOtherMessage1 = () => sharedMessage;
        const getOtherMessage2 = () => sharedMessage;
        export const target1 = () => getTargetMessage1();
        export const target2 = () => getTargetMessage2();
        export const other1 = () => getOtherMessage1();
        export const other2 = () => getOtherMessage2();
      `;
      expect(hasChunkableExport(code, "target1", ...cache)).toBe(false);
      expect(getChunkedExport(code, "target1", {}, ...cache)).toBeUndefined();
      expect(hasChunkableExport(code, "target2", ...cache)).toBe(false);
      expect(getChunkedExport(code, "target2", {}, ...cache)).toBeUndefined();
      expect(
        omitChunkedExports(code, ["target1", "target2"], {}, ...cache)?.code
      ).toMatchInlineSnapshot(`
        "const sharedMessage = "shared";
        const getTargetMessage1 = () => sharedMessage;
        const getTargetMessage2 = () => sharedMessage;
        const getOtherMessage1 = () => sharedMessage;
        const getOtherMessage2 = () => sharedMessage;
        export const target1 = () => getTargetMessage1();
        export const target2 = () => getTargetMessage2();
        export const other1 = () => getOtherMessage1();
        export const other2 = () => getOtherMessage2();"
      `);
    });

    test("functions sharing an imported identifier", () => {
      const code = dedent`
        import { sharedMessage } from "./messages";
        const getTargetMessage1 = () => sharedMessage;
        const getTargetMessage2 = () => sharedMessage;
        const getOtherMessage1 = () => sharedMessage;
        const getOtherMessage2 = () => sharedMessage;
        export const target1 = () => getTargetMessage1();
        export const target2 = () => getTargetMessage2();
        export const other1 = () => getOtherMessage1();
        export const other2 = () => getOtherMessage2();
      `;
      expect(hasChunkableExport(code, "target1", ...cache)).toBe(false);
      expect(getChunkedExport(code, "target1", {}, ...cache)).toBeUndefined();
      expect(hasChunkableExport(code, "target2", ...cache)).toBe(false);
      expect(getChunkedExport(code, "target2", {}, ...cache)).toBeUndefined();
      expect(
        omitChunkedExports(code, ["target1", "target2"], {}, ...cache)?.code
      ).toMatchInlineSnapshot(`
        "import { sharedMessage } from "./messages";
        const getTargetMessage1 = () => sharedMessage;
        const getTargetMessage2 = () => sharedMessage;
        const getOtherMessage1 = () => sharedMessage;
        const getOtherMessage2 = () => sharedMessage;
        export const target1 = () => getTargetMessage1();
        export const target2 = () => getTargetMessage2();
        export const other1 = () => getOtherMessage1();
        export const other2 = () => getOtherMessage2();"
      `);
    });

    test("functions sharing a default import", () => {
      const code = dedent`
        import sharedMessage from "./messages";
        const getTargetMessage1 = () => sharedMessage;
        const getTargetMessage2 = () => sharedMessage;
        const getOtherMessage1 = () => sharedMessage;
        const getOtherMessage2 = () => sharedMessage;
        export const target1 = () => getTargetMessage1();
        export const target2 = () => getTargetMessage2();
        export const other1 = () => getOtherMessage1();
        export const other2 = () => getOtherMessage2();
      `;
      expect(hasChunkableExport(code, "target1", ...cache)).toBe(false);
      expect(getChunkedExport(code, "target1", {}, ...cache)).toBeUndefined();
      expect(hasChunkableExport(code, "target2", ...cache)).toBe(false);
      expect(getChunkedExport(code, "target2", {}, ...cache)).toBeUndefined();
      expect(
        omitChunkedExports(code, ["target1", "target2"], {}, ...cache)?.code
      ).toMatchInlineSnapshot(`
        "import sharedMessage from "./messages";
        const getTargetMessage1 = () => sharedMessage;
        const getTargetMessage2 = () => sharedMessage;
        const getOtherMessage1 = () => sharedMessage;
        const getOtherMessage2 = () => sharedMessage;
        export const target1 = () => getTargetMessage1();
        export const target2 = () => getTargetMessage2();
        export const other1 = () => getOtherMessage1();
        export const other2 = () => getOtherMessage2();"
      `);
    });

    test("functions sharing a namespace import", () => {
      const code = dedent`
        import * as messages from "./messages";
        const getTargetMessage1 = () => messages.targetMessage1;
        const getTargetMessage2 = () => messages.targetMessage2;
        const getOtherMessage1 = () => messages.otherMessage1;
        const getOtherMessage2 = () => messages.otherMessage2;
        export const target1 = () => getTargetMessage1();
        export const target2 = () => getTargetMessage2();
        export const other1 = () => getOtherMessage1();
        export const other2 = () => getOtherMessage2();
      `;
      expect(hasChunkableExport(code, "target1", ...cache)).toBe(false);
      expect(getChunkedExport(code, "target1", {}, ...cache)).toBeUndefined();
      expect(hasChunkableExport(code, "target2", ...cache)).toBe(false);
      expect(getChunkedExport(code, "target2", {}, ...cache)).toBeUndefined();
      expect(
        omitChunkedExports(code, ["target1", "target2"], {}, ...cache)?.code
      ).toMatchInlineSnapshot(`
        "import * as messages from "./messages";
        const getTargetMessage1 = () => messages.targetMessage1;
        const getTargetMessage2 = () => messages.targetMessage2;
        const getOtherMessage1 = () => messages.otherMessage1;
        const getOtherMessage2 = () => messages.otherMessage2;
        export const target1 = () => getTargetMessage1();
        export const target2 = () => getTargetMessage2();
        export const other1 = () => getOtherMessage1();
        export const other2 = () => getOtherMessage2();"
      `);
    });
  });
});
