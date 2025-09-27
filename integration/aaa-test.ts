import { expect } from "@playwright/test";
// import getPort from "get-port";
import type { Readable } from "node:stream";

import { testTemplate } from "./aaa-utils";

const tsx = String.raw;

const test = testTemplate("vite-6-template", {
  "app/routes/_index.tsx": tsx`
    // const b: number = true

    export default function Index() {
      return <div>Hello, world!</div>;
    }
  `,
});

test("typecheck", async ({ $, edit }) => {
  await $(`pnpm typecheck`);

  await edit({
    "app/root.tsx": (code) =>
      code +
      "\n\n" +
      tsx`
        const a: string = 1
      `,
    "app/routes/_index.tsx": tsx`
      const b: number = true

      export default function Index() {
        return <div>Index</div>;
      }
    `,
  });
  // const typecheck = await $(`pnpm typecheck`, { reject: false });
  // expect(typecheck.exitCode).toBe(2);

  const dev = $(`pnpm dev`);
  const url = await matchStream(dev.stdout!, viteDevUrlRE);
  expect(url).toBe("http://localhost:5173/");
});

async function matchStream(
  stream: Readable,
  pattern: RegExp,
  options: {
    /** Measured in ms */
    timeout?: number;
  } = {},
): Promise<string> {
  // Prepare error outside of promise so that stacktrace points to caller of `matchLine`
  const timeout = new Error(`Timed out - Could not find pattern: ${pattern}`);
  return new Promise<string>(async (resolve, reject) => {
    setTimeout(() => reject(timeout), options.timeout ?? 10_000);
    stream.on("data", (data) => {
      const line = data.toString();
      const matches = line.match(pattern);
      if (matches) {
        resolve(matches[1]);
      }
    });
  });
}

const urlRE = /http:\/\/\S+/;
const viteDevUrlRE = new RegExp(/Local:\s+/.source + "(" + urlRE.source + ")");
