import dedent from "dedent";

import {
  getTopLevelStatementsByExportName,
  hasChunkableExport,
} from "./route-chunks";

describe("hasChunkableExport", () => {
  function chunkable(code: string, exportName: string) {
    const topLevelStatementsByExport = getTopLevelStatementsByExportName(code);
    return hasChunkableExport(topLevelStatementsByExport, exportName);
  }

  describe("chunkable", () => {
    test("default function export with no identifiers", () => {
      const code = dedent`
        export default function () {
          return null;
        }

        export const other = () => {
          return null;
        }
      `;
      expect(chunkable(code, "default")).toBe(true);
    });

    test("const function containing no identifiers", () => {
      const code = dedent`
        export const target = () => {
          return null;
        }

        export const other = () => {
          return null;
        }
      `;
      expect(chunkable(code, "target")).toBe(true);
    });

    test("const function referencing its own identifiers", () => {
      const code = dedent`
        import { targetMessage } from "./targetMessage";
        const getTargetMessage = () => targetMessage;
        export const target = () => getTargetMessage();

        import { otherMessage } from "./otherMessage";
        const getOtherMessage = () => otherMessage;
        export const other = () => getOtherMessage();
      `;
      expect(chunkable(code, "target")).toBe(true);
    });

    test("function declaration referencing its own identifiers", () => {
      const code = dedent`
        import { targetMessage } from "./targetMessage";
        const getTargetMessage = () => targetMessage;
        export function target() { return getTargetMessage(); }

        import { otherMessage } from "./otherMessage";
        const getOtherMessage = () => otherMessage;
        export function other() { return getOtherMessage(); }
      `;
      expect(chunkable(code, "target")).toBe(true);
    });
  });

  describe("not chunkable", () => {
    test("export not present", () => {
      const code = dedent`
        export default function () {}
      `;
      expect(chunkable(code, "target")).toBe(false);
    });

    test("const function interacting with shared import", () => {
      const code = dedent`
        import { sharedMessage } from "./sharedMessage";

        const targetMessage = sharedMessage;
        const getTargetMessage = () => targetMessage;
        export const target = () => getTargetMessage();

        const otherMessage = sharedMessage;
        const getOtherMessage = () => otherMessage;
        export const other = () => getOtherMessage();
      `;
      expect(chunkable(code, "target")).toBe(false);
    });

    test("const function interacting with shared import statement", () => {
      const code = dedent`
        import { targetMessage, otherMessage } from "./messages";

        const getTargetMessage = () => targetMessage;
        export const target = () => getTargetMessage();

        const getOtherMessage = () => otherMessage;
        export const other = () => getOtherMessage();
      `;
      expect(chunkable(code, "target")).toBe(false);
    });

    test("const function interacting with shared named import", () => {
      const code = dedent`
        import * as messages from "./messages";

        const getTargetMessage = () => messages.targetMessage;
        export const target = () => getTargetMessage();

        const getOtherMessage = () => messages.otherMessage;
        export const other = () => getOtherMessage();
      `;
      expect(chunkable(code, "target")).toBe(false);
    });
  });
});
