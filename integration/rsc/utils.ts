import { expect } from "@playwright/test";
import { sync as spawnSync } from "cross-spawn";

import {
  type TemplateName,
  createDev,
  createProject,
} from "../helpers/vite.js";

export const js = String.raw;

export type Implementation = {
  name: string;
  template: TemplateName;
  /** Build a production app */
  build: ({ cwd }: { cwd: string }) => ReturnType<typeof spawnSync>;
  /** Run a production app */
  run: ({ cwd, port }: { cwd: string; port: number }) => Promise<() => void>;
  /** Run the dev server */
  dev: ({ cwd, port }: { cwd: string; port: number }) => Promise<() => void>;
};

// Run tests against vite and parcel to ensure our code is bundler agnostic
export const implementations: Implementation[] = [
  {
    name: "vite",
    template: "rsc-vite",
    build: ({ cwd }: { cwd: string }) => spawnSync("pnpm", ["build"], { cwd }),
    run: ({ cwd, port }) =>
      createDev(["server.js", "-p", String(port)])({
        cwd,
        port,
        env: {
          NODE_ENV: "production",
        },
      }),
    dev: ({ cwd, port }) =>
      createDev(["node_modules/vite/bin/vite.js", "--port", String(port)])({
        cwd,
        port,
      }),
  },
  {
    name: "parcel",
    template: "rsc-parcel",
    build: ({ cwd }: { cwd: string }) => spawnSync("pnpm", ["build"], { cwd }),
    run: ({ cwd, port }) =>
      createDev(["dist/server/server.js", "-p", String(port)])({
        cwd,
        port,
        env: {
          NODE_ENV: "production",
        },
      }),
    dev: ({ cwd, port }) =>
      createDev(["node_modules/parcel/lib/bin.js"])({
        // Since we run through parcels dev server we can't use `-p` because that
        // only changes the dev server and doesn't pass through to the internal
        // server.  So we setup the internal server to choose from `RR_PORT`
        env: { RR_PORT: String(port) },
        cwd,
        port,
      }),
  },
] as Implementation[];

export async function setupRscTest({
  implementation,
  port,
  dev,
  files,
}: {
  implementation: Implementation;
  port: number;
  dev?: boolean;
  files: Record<string, string>;
}) {
  let cwd = await createProject(files, implementation.template);

  let { error, status, stderr, stdout } = implementation.build({ cwd });
  if (status !== 0) {
    console.error("Error building project", {
      status,
      error,
      stdout: stdout?.toString(),
      stderr: stderr?.toString(),
    });
    throw new Error("Error building project");
  }
  return dev
    ? implementation.dev({ cwd, port })
    : implementation.run({ cwd, port });
}

export const validateRSCHtml = (html: string) =>
  expect(html).toMatch(/\(self\.__FLIGHT_DATA\|\|=\[\]\)\.push\(/);
