import type { ChildProcess } from "node:child_process";
import { sync as spawnSync, spawn } from "cross-spawn";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { platform } from "node:os";
import type { Readable } from "node:stream";
import url from "node:url";
import path from "pathe";
import stripIndent from "strip-indent";
import waitOn from "wait-on";
import getPort from "get-port";
import shell from "shelljs";
import glob from "glob";
import dedent from "dedent";
import type { Page } from "@playwright/test";
import { test as base, expect } from "@playwright/test";
import type { Config } from "@react-router/dev/config";

const require = createRequire(import.meta.url);

const reactRouterBin = "node_modules/@react-router/dev/bin.js";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const root = path.resolve(__dirname, "../..");
const TMP_DIR = path.join(root, ".tmp/integration");

export const reactRouterConfig = ({
  ssr,
  basename,
  prerender,
  appDirectory,
  splitRouteModules,
  viteEnvironmentApi,
  v8_middleware,
  routeDiscovery,
}: {
  ssr?: boolean;
  basename?: string;
  prerender?: boolean | string[];
  appDirectory?: string;
  splitRouteModules?: NonNullable<
    Config["future"]
  >["unstable_splitRouteModules"];
  viteEnvironmentApi?: boolean;
  v8_middleware?: boolean;
  routeDiscovery?: Config["routeDiscovery"];
}) => {
  let config: Config = {
    ssr,
    basename,
    prerender,
    appDirectory,
    routeDiscovery,
    future: {
      unstable_splitRouteModules: splitRouteModules,
      unstable_viteEnvironmentApi: viteEnvironmentApi,
      v8_middleware,
    },
  };

  return dedent`
    import type { Config } from "@react-router/dev/config";

    export default ${JSON.stringify(config)} satisfies Config;
  `;
};

type ViteConfigServerArgs = {
  port: number;
  fsAllow?: string[];
};

type ViteConfigBuildArgs = {
  assetsInlineLimit?: number;
  assetsDir?: string;
  cssCodeSplit?: boolean;
};

type ViteConfigBaseArgs = {
  templateName?: TemplateName;
  base?: string;
  envDir?: string;
  mdx?: boolean;
  vanillaExtract?: boolean;
};

type ViteConfigArgs = (
  | ViteConfigServerArgs
  | { [K in keyof ViteConfigServerArgs]?: never }
) &
  ViteConfigBuildArgs &
  ViteConfigBaseArgs;

export const viteConfig = {
  server: async (args: ViteConfigServerArgs) => {
    let { port, fsAllow } = args;
    let hmrPort = await getPort();
    let text = dedent`
      server: {
        port: ${port},
        strictPort: true,
        hmr: { port: ${hmrPort} },
        fs: { allow: ${fsAllow ? JSON.stringify(fsAllow) : "undefined"} }
      },
    `;
    return text;
  },
  build: ({
    assetsInlineLimit,
    assetsDir,
    cssCodeSplit,
  }: ViteConfigBuildArgs = {}) => {
    return dedent`
      build: {
        // Detect rolldown-vite. This should ideally use "rolldownVersion"
        // but that's not exported. Once that's available, this
        // check should be updated to use it.
        rollupOptions: "transformWithOxc" in (await import("vite"))
          ? {
              onwarn(warning, warn) {
                // Ignore "The built-in minifier is still under development." warning
                if (warning.code === "MINIFY_WARNING") return;
                warn(warning);
              },
            }
          : undefined,
        assetsInlineLimit: ${assetsInlineLimit ?? "undefined"},
        assetsDir: ${assetsDir ? `"${assetsDir}"` : "undefined"},
        cssCodeSplit: ${
          cssCodeSplit !== undefined ? cssCodeSplit : "undefined"
        },
      },
    `;
  },
  basic: async (args: ViteConfigArgs) => {
    const isRsc = args.templateName?.includes("rsc");
    return dedent`
      ${
        !isRsc
          ? "import { reactRouter } from '@react-router/dev/vite';"
          : [
              "import { unstable_reactRouterRSC as reactRouterRSC } from '@react-router/dev/vite';",
              "import rsc from '@vitejs/plugin-rsc';",
            ].join("\n")
      }
      ${args.mdx ? 'import mdx from "@mdx-js/rollup";' : ""}
      ${args.vanillaExtract ? 'import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";' : ""}
      import { envOnlyMacros } from "vite-env-only";
      import tsconfigPaths from "vite-tsconfig-paths";

      export default async () => ({
        ${args.port ? await viteConfig.server(args) : ""}
        ${viteConfig.build(args)}
        ${args.base ? `base: "${args.base}",` : ""}
        envDir: ${args.envDir ? `"${args.envDir}"` : "undefined"},
        plugins: [
          ${args.mdx ? "mdx()," : ""}
          ${args.vanillaExtract ? "vanillaExtractPlugin({ emitCssInSsr: true })," : ""}
          ${isRsc ? "reactRouterRSC()," : "reactRouter(),"}
          ${isRsc ? "rsc()," : ""}
          envOnlyMacros(),
          tsconfigPaths()
        ],
      });
    `;
  },
};

export const EXPRESS_SERVER = (args: {
  port: number;
  base?: string;
  loadContext?: Record<string, unknown>;
  customLogic?: string;
  templateName?: TemplateName;
}) => {
  if (args.templateName?.includes("rsc")) {
    return String.raw`
      import { createRequestListener } from "@remix-run/node-fetch-server";
      import express from "express";

      const viteDevServer =
        process.env.NODE_ENV === "production"
          ? undefined
          : await import("vite").then(({ createServer }) =>
              createServer({
                server: {
                  middlewareMode: true,
                },
              })
            );
      const app = express();      

      ${args?.customLogic || ""}

      if (viteDevServer) {
        app.use(viteDevServer.middlewares);
      } else {
        app.use(
          "/assets",
          express.static("build/client/assets", { immutable: true, maxAge: "1y" })
        );
        app.all("*", createRequestListener((await import("./build/server/index.js")).default));
      }

      const port = ${args.port};
      app.listen(port, () => console.log('http://localhost:' + port));
    `;
  }

  return String.raw`
    import { createRequestHandler } from "@react-router/express";
    import express from "express";

    let viteDevServer =
      process.env.NODE_ENV === "production"
        ? undefined
        : await import("vite").then((vite) =>
            vite.createServer({
              server: { middlewareMode: true },
            })
          );

    const app = express();

    if (viteDevServer) {
      app.use(viteDevServer.middlewares);
    } else {
      app.use(
        "/assets",
        express.static("build/client/assets", { immutable: true, maxAge: "1y" })
      );
    }
    app.use(express.static("build/client", { maxAge: "1h" }));

    ${args?.customLogic || ""}

    app.all(
      "*",
      createRequestHandler({
        build: viteDevServer
          ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
          : await import("./build/index.js"),
        getLoadContext: () => (${JSON.stringify(args.loadContext ?? {})}),
      })
    );

    const port = ${args.port};
    app.listen(port, () => console.log('http://localhost:' + port));
  `;
};

type FrameworkModeViteMajorTemplateName =
  | "vite-5-template"
  | "vite-6-template"
  | "vite-7-beta-template"
  | "vite-plugin-cloudflare-template"
  | "vite-rolldown-template";

type FrameworkModeRscTemplateName = "rsc-vite-framework";

type FrameworkModeCloudflareTemplateName =
  | "cloudflare-dev-proxy-template"
  | "vite-plugin-cloudflare-template";

export type RscBundlerTemplateName = "rsc-vite" | "rsc-parcel";

export type TemplateName =
  | FrameworkModeViteMajorTemplateName
  | FrameworkModeRscTemplateName
  | FrameworkModeCloudflareTemplateName
  | RscBundlerTemplateName;

export const viteMajorTemplates = [
  { templateName: "vite-5-template", templateDisplayName: "Vite 5" },
  { templateName: "vite-6-template", templateDisplayName: "Vite 6" },
  { templateName: "vite-7-beta-template", templateDisplayName: "Vite 7 Beta" },
  {
    templateName: "vite-rolldown-template",
    templateDisplayName: "Vite Rolldown",
  },
] as const satisfies Array<{
  templateName: FrameworkModeViteMajorTemplateName;
  templateDisplayName: string;
}>;

export const rscBundlerTemplates = [
  { templateName: "rsc-vite", templateDisplayName: "RSC (Vite)" },
  { templateName: "rsc-parcel", templateDisplayName: "RSC (Parcel)" },
] as const satisfies Array<{
  templateName: RscBundlerTemplateName;
  templateDisplayName: string;
}>;

export async function createProject(
  files: Record<string, string> = {},
  templateName: TemplateName = "vite-5-template",
) {
  let projectName = `rr-${Math.random().toString(32).slice(2)}`;
  let projectDir = path.join(TMP_DIR, projectName);
  await mkdir(projectDir, { recursive: true });

  // base template
  let templateDir = path.resolve(__dirname, templateName);
  await cp(templateDir, projectDir, { errorOnExist: true, recursive: true });

  // user-defined files
  await Promise.all(
    Object.entries(files).map(async ([filename, contents]) => {
      let filepath = path.join(projectDir, filename);
      await mkdir(path.dirname(filepath), { recursive: true });
      await writeFile(filepath, stripIndent(contents));
    }),
  );

  return projectDir;
}

// Avoid "Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env
// being set" in vite-ecosystem-ci which breaks empty stderr assertions. To fix
// this, we always ensure that only NO_COLOR is set after spreading process.env.
const colorEnv = {
  FORCE_COLOR: undefined,
  NO_COLOR: "1",
} as const;

export const build = ({
  cwd,
  env = {},
}: {
  cwd: string;
  env?: Record<string, string>;
}) => {
  let nodeBin = process.argv[0];

  return spawnSync(nodeBin, [reactRouterBin, "build"], {
    cwd,
    env: {
      ...process.env,
      ...colorEnv,
      ...env,
      // Ensure build can pass in Rolldown. This can be removed once
      // "preserveEntrySignatures" is supported in rolldown-vite.
      ROLLDOWN_OPTIONS_VALIDATION: "loose",
    },
  });
};

export const reactRouterServe = async ({
  cwd,
  port,
  serverBundle,
  basename,
}: {
  cwd: string;
  port: number;
  serverBundle?: string;
  basename?: string;
}) => {
  let nodeBin = process.argv[0];
  let serveProc = spawn(
    nodeBin,
    [
      "node_modules/@react-router/serve/dist/cli.js",
      `build/server/${serverBundle ? serverBundle + "/" : ""}index.js`,
    ],
    {
      cwd,
      stdio: "pipe",
      env: { NODE_ENV: "production", PORT: port.toFixed(0) },
    },
  );
  await waitForServer(serveProc, { port, basename });
  return () => serveProc.kill();
};

export const wranglerPagesDev = async ({
  cwd,
  port,
}: {
  cwd: string;
  port: number;
}) => {
  let nodeBin = process.argv[0];
  let wranglerBin = require.resolve("wrangler/bin/wrangler.js", {
    paths: [cwd],
  });

  let proc = spawn(
    nodeBin,
    [wranglerBin, "pages", "dev", "./build/client", "--port", String(port)],
    {
      cwd,
      stdio: "pipe",
      env: { NODE_ENV: "production" },
    },
  );
  await waitForServer(proc, { port, host: "127.0.0.1" });
  return () => proc.kill();
};

type ServerArgs = {
  cwd: string;
  port: number;
  env?: Record<string, string>;
  basename?: string;
};

export const createDev =
  (nodeArgs: string[]) =>
  async ({ cwd, port, env, basename }: ServerArgs): Promise<() => unknown> => {
    let proc = node(nodeArgs, { cwd, env });
    await waitForServer(proc, { port, basename });
    return () => proc.kill();
  };

export const dev = createDev([reactRouterBin, "dev"]);
export const customDev = createDev(["./server.mjs"]);

// Used for testing errors thrown on build when we don't want to start and
// wait for the server
export const viteDevCmd = ({ cwd }: { cwd: string }) => {
  let nodeBin = process.argv[0];
  return spawnSync(nodeBin, [reactRouterBin, "dev"], {
    cwd,
    env: { ...process.env },
  });
};

declare module "@playwright/test" {
  interface Page {
    errors: Error[];
  }
}

export type Files = (args: { port: number }) => Promise<Record<string, string>>;
type Fixtures = {
  page: Page;
  dev: (
    files: Files,
    templateName?: TemplateName,
  ) => Promise<{
    port: number;
    cwd: string;
  }>;
  customDev: (
    files: Files,
    templateName?: TemplateName,
  ) => Promise<{
    port: number;
    cwd: string;
  }>;
  reactRouterServe: (files: Files) => Promise<{
    port: number;
    cwd: string;
  }>;
  wranglerPagesDev: (files: Files) => Promise<{
    port: number;
    cwd: string;
  }>;
};

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    page.errors = [];
    page.on("pageerror", (error: Error) => page.errors.push(error));
    await use(page);
  },
  // eslint-disable-next-line no-empty-pattern
  dev: async ({}, use) => {
    let stop: (() => unknown) | undefined;
    await use(async (files, template) => {
      let port = await getPort();
      let cwd = await createProject(await files({ port }), template);
      stop = await dev({ cwd, port });
      return { port, cwd };
    });
    stop?.();
  },
  // eslint-disable-next-line no-empty-pattern
  customDev: async ({}, use) => {
    let stop: (() => unknown) | undefined;
    await use(async (files, template) => {
      let port = await getPort();
      let cwd = await createProject(await files({ port }), template);
      stop = await customDev({ cwd, port });
      return { port, cwd };
    });
    stop?.();
  },
  // eslint-disable-next-line no-empty-pattern
  reactRouterServe: async ({}, use) => {
    let stop: (() => unknown) | undefined;
    await use(async (files) => {
      let port = await getPort();
      let cwd = await createProject(await files({ port }));
      let { status } = build({ cwd });
      expect(status).toBe(0);
      stop = await reactRouterServe({ cwd, port });
      return { port, cwd };
    });
    stop?.();
  },
  // eslint-disable-next-line no-empty-pattern
  wranglerPagesDev: async ({}, use) => {
    let stop: (() => unknown) | undefined;
    await use(async (files) => {
      let port = await getPort();
      let cwd = await createProject(
        await files({ port }),
        "cloudflare-dev-proxy-template",
      );
      let { status } = build({ cwd });
      expect(status).toBe(0);
      stop = await wranglerPagesDev({ cwd, port });
      return { port, cwd };
    });
    stop?.();
  },
});

function node(
  args: string[],
  options: { cwd: string; env?: Record<string, string> },
) {
  let nodeBin = process.argv[0];

  let proc = spawn(nodeBin, args, {
    cwd: options.cwd,
    env: {
      ...process.env,
      ...colorEnv,
      ...options.env,
    },
    stdio: "pipe",
  });
  return proc;
}

async function waitForServer(
  proc: ChildProcess & { stdout: Readable; stderr: Readable },
  args: { port: number; host?: string; basename?: string },
) {
  let devStdout = bufferize(proc.stdout);
  let devStderr = bufferize(proc.stderr);

  await waitOn({
    resources: [
      `http://${args.host ?? "localhost"}:${args.port}${
        args.basename ?? "/favicon.ico"
      }`,
    ],
    timeout: platform() === "win32" ? 20000 : 10000,
  }).catch((err) => {
    let stdout = devStdout();
    let stderr = devStderr();
    proc.kill();
    throw new Error(
      [
        err.message,
        "",
        "exit code: " + proc.exitCode,
        "stdout: " + stdout ? `\n${stdout}\n` : "<empty>",
        "stderr: " + stderr ? `\n${stderr}\n` : "<empty>",
      ].join("\n"),
    );
  });
}

function bufferize(stream: Readable): () => string {
  let buffer = "";
  stream.on("data", (data) => (buffer += data.toString()));
  return () => buffer;
}

export function createEditor(projectDir: string) {
  return async function edit(
    file: string,
    transform: (contents: string) => string,
  ) {
    let filepath = path.join(projectDir, file);
    let contents = await readFile(filepath, "utf8");
    await writeFile(filepath, transform(contents), "utf8");

    return async function revert() {
      await writeFile(filepath, contents, "utf8");
    };
  };
}

export function grep(cwd: string, pattern: RegExp): string[] {
  let assetFiles = glob.sync("**/*.@(js|jsx|ts|tsx)", {
    cwd,
    absolute: true,
  });

  let lines = shell
    .grep("-l", pattern, assetFiles)
    .stdout.trim()
    .split("\n")
    .filter((line) => line.length > 0);
  return lines;
}
