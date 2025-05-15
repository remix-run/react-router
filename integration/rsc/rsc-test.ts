import { spawnSync } from "node:child_process";
import { test, expect } from "@playwright/test";
import getPort from "get-port";

import { TemplateName, createDev, createProject } from "../helpers/vite.js";

const js = String.raw;

type Implementation = {
  name: string;
  template: TemplateName;
  build: ({ cwd }: { cwd: string }) => ReturnType<typeof spawnSync>;
  run: ({ cwd, port }: { cwd: string; port: number }) => Promise<() => void>;
};

// Run tests against vite and parcel to ensure our code is bundler agnostic
const implementations: Implementation[] = [
  {
    name: "vite",
    template: "rsc-vite",
    build: ({ cwd }: { cwd: string }) =>
      spawnSync("node_modules/.bin/vite", ["build"], { cwd }),
    run: ({ cwd, port }: { cwd: string; port: number }) =>
      createDev(["server.js", "-p", String(port)])({
        cwd,
        port,
      }),
  },
  {
    name: "parcel",
    template: "rsc-parcel",
    build: ({ cwd }: { cwd: string }) =>
      spawnSync("node_modules/.bin/parcel", ["build"], { cwd }),
    run: ({ cwd, port }: { cwd: string; port: number }) =>
      // FIXME: Parcel prod builds seems to have dup copies of react in them :/
      // Not reproducible in the playground though - only in integration/helpers...
      createDev(["node_modules/parcel/lib/bin.js"])({
        // Since we run through parcels dev server we can't use `-p` because that
        // only changes the dev server and doesn't pass through to the internal
        // server.  So we setup the internal server to choose from `RR_PORT`
        env: { RR_PORT: String(port) },
        cwd,
        port,
      }),
  },
];

async function setupRscTest({
  implementation,
  port,
  files,
}: {
  implementation: Implementation;
  port: number;
  files: Record<string, string>;
}) {
  let cwd = await createProject(files, implementation.template);

  let { status, stderr, stdout } = implementation.build({ cwd });
  if (status !== 0) {
    console.error("Error building project", {
      status,
      stdout: stdout.toString(),
      stderr: stderr.toString,
    });
    throw new Error("Error building project");
  }
  let stop = await implementation.run({ cwd, port });
  return stop;
}

test.describe("RSC", () => {
  implementations.forEach((implementation) => {
    let stop: () => void;

    test.afterEach(() => {
      stop?.();
    });

    test.describe(implementation.name, () => {
      test.only("Renders a page using server components", async ({ page }) => {
        let port = await getPort();
        stop = await setupRscTest({
          implementation,
          port,
          files: {
            "src/routes/home.tsx": js`
              export function loader() {
                return { message: "Loader Data" };
              }
              export default function ServerComponent({ loaderData }) {
                return <h2 data-home>Home: {loaderData.message}</h2>;
              }
            `,
          },
        });

        await page.goto(`http://localhost:${port}/`);
        await page.waitForSelector("[data-home]", { timeout: 5000 });
        expect(await page.locator("[data-home]").textContent()).toBe(
          "Home: Loader Data"
        );
        // Ensure this is actually using RSC lol
        expect(await page.content()).toMatch(
          /\(self\.__FLIGHT_DATA\|\|=\[\]\)\.push\(/
        );
      });
    });
  });
});
